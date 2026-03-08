import { test, expect, Page, BrowserContext, Browser, chromium } from "@playwright/test";

/**
 * Teletable Realtime & Resilience Tests with Screenshot Capture
 */

const TEST_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3001";

async function waitForAuthedRoomInfoRequest(page: Page, roomId: string) {
  const request = await page.waitForRequest((req) => {
    if (!req.url().includes("/api/getBasicRoomInfo")) {
      return false;
    }
    if (!req.url().includes(`roomId=${roomId}`)) {
      return false;
    }
    if (req.method() !== "GET") {
      return false;
    }
    const authHeader = req.headers()["authorization"] || "";
    return authHeader.startsWith("Bearer ") && authHeader.length > 10;
  });

  const authHeader = request.headers()["authorization"];
  const userId = new URL(request.url()).searchParams.get("userId");

  if (!authHeader || !userId) {
    throw new Error("Failed to extract auth header or userId from room info request");
  }

  return { authHeader, userId };
}

async function ensureRoomExists(
  page: Page,
  roomId: string,
  hostId: string,
  authHeader: string
) {
  const response = await page.request.post("/api/createRoom", {
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    data: {
      roomId,
      hostId,
    },
  });

  // 409 means the room already exists, which is fine for retries.
  if (response.status() === 409) {
    return;
  }

  expect(response.ok()).toBeTruthy();
}

async function getRoomInfo(
  page: Page,
  roomId: string,
  userId: string,
  authHeader: string
) {
  const response = await page.request.get(
    `/api/getBasicRoomInfo?roomId=${roomId}&userId=${userId}`,
    {
      headers: {
        Authorization: authHeader,
      },
    }
  );
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.roomInfo || body;
}

async function waitForRoomInfoValue<T>(
  producer: () => Promise<T | null>,
  timeoutMs = 45000,
  intervalMs = 1000
) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = await producer();
    if (value) {
      return value;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("Timed out waiting for room info condition");
}

async function gotoWithRetry(page: Page, url: string, attempts = 3) {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await page.goto(url, { waitUntil: "commit", timeout: 20000 });
      return;
    } catch (error) {
      lastError = error;
      const message = String(error);
      const isRetriableNavigationError =
        message.includes("ERR_ABORTED") || message.includes("frame was detached");
      if (!isRetriableNavigationError || attempt === attempts) {
        throw error;
      }
      await page.waitForTimeout(1000 * attempt);
    }
  }
  throw lastError;
}

test.describe("Teletable Realtime Resilience", () => {
  let clientBrowser: Browser | null = null;
  let hostContext: BrowserContext;
  let clientContext: BrowserContext;
  let hostPage: Page;
  let clientPage: Page;
  const roomId = "test-realtime-room-" + Math.random().toString(36).substring(7);

  test.beforeAll(async ({ browser }) => {
    hostContext = await browser.newContext({
      permissions: ["camera", "microphone"],
      viewport: { width: 1280, height: 720 },
    });

    // Run client in a separate browser process to avoid renderer/frame detach issues
    // with two heavy WebGL pages in one process.
    clientBrowser = await chromium.launch({
      headless: true,
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
    });

    clientContext = await clientBrowser.newContext({
      permissions: ["camera", "microphone"],
      viewport: { width: 1280, height: 720 },
    });
  });

  test.afterAll(async () => {
    await hostContext.close();
    await clientContext.close();
    await clientBrowser?.close();
  });

  test("Capture Real-time Reconnection Flow", async () => {
    test.setTimeout(180000);

    hostPage = await hostContext.newPage();
    clientPage = await clientContext.newPage();

    // 1. Host initialization and room provisioning
    console.log(`[Test] Navigating to host page: ${roomId}`);
    await gotoWithRetry(hostPage, `${TEST_BASE_URL}/host/${roomId}`);

    const { authHeader, userId } = await waitForAuthedRoomInfoRequest(
      hostPage,
      roomId
    );
    await ensureRoomExists(hostPage, roomId, userId, authHeader);

    const initialHostPeerId = await waitForRoomInfoValue<string>(async () => {
      const roomInfo = await getRoomInfo(hostPage, roomId, userId, authHeader);
      return roomInfo.hostPeerId || null;
    });

    // Capture Host Ready
    await hostPage.screenshot({ path: "screenshots/actual-host-ready.png" });
    console.log("[Test] Captured: actual-host-ready.png");

    // 2. Client connection + approval flow
    console.log(`[Test] Navigating to client page: ${roomId}`);
    await gotoWithRetry(clientPage, `${TEST_BASE_URL}/rooms/${roomId}`);

    await expect(
      clientPage.getByRole("button", { name: /Request Control/i })
    ).toBeVisible({ timeout: 30000 });

    // Request & Approve Control
    await clientPage.getByRole("button", { name: /Request Control/i }).click();

    const requestingClientId = await waitForRoomInfoValue<string>(async () => {
      const roomInfo = await getRoomInfo(hostPage, roomId, userId, authHeader);
      const requestingClients = Object.keys(
        roomInfo?.info?.requestingClientIds || {}
      );
      if (requestingClients.length === 0) {
        return null;
      }
      return requestingClients[0];
    });

    const approveResponse = await hostPage.request.post("/api/approveClientRequest", {
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      data: {
        hostId: userId,
        roomId,
        clientId: requestingClientId,
      },
    });
    expect(approveResponse.ok()).toBeTruthy();

    await expect(clientPage.getByText(/In Control/i)).toBeVisible({
      timeout: 45000,
    });

    await clientPage.waitForFunction(() => {
      const localPeer = (window as any).peer?.peer;
      if (!localPeer?.connections) {
        return false;
      }
      return Object.values(localPeer.connections).some(
        (connections: any) =>
          Array.isArray(connections) &&
          connections.some((connection: any) => connection?.open)
      );
    });

    // Capture Client Connected & In Control
    await clientPage.screenshot({
      path: "screenshots/actual-client-connected.png",
    });
    console.log("[Test] Captured: actual-client-connected.png");

    // 3. Simulate Host Restart
    console.log("[Test] Simulating Host restart (reloading host page)...");
    await hostPage.reload();

    const newHostPeerId = await waitForRoomInfoValue<string>(async () => {
      const roomInfo = await getRoomInfo(hostPage, roomId, userId, authHeader);
      const nextPeerId = roomInfo.hostPeerId || null;
      if (!nextPeerId || nextPeerId === initialHostPeerId) {
        return null;
      }
      return nextPeerId;
    });
    await hostPage.screenshot({
      path: "screenshots/actual-host-restarted-ready.png",
    });
    console.log("[Test] Captured: actual-host-restarted-ready.png");

    // 4. Verify Auto-Reconnection
    console.log("[Test] Waiting for client to reconnect automatically...");
    await clientPage.waitForFunction(
      (expectedHostPeerId) => {
        const localPeer = (window as any).peer?.peer;
        if (!localPeer?.connections || !expectedHostPeerId) {
          return false;
        }
        const hostConnections = localPeer.connections[expectedHostPeerId];
        return (
          Array.isArray(hostConnections) &&
          hostConnections.some((connection: any) => connection?.open)
        );
      },
      newHostPeerId,
      { timeout: 45000 }
    );
    await expect(clientPage.getByText(/In Control/i)).toBeVisible({
      timeout: 15000,
    });

    // Capture Post-Reconnection
    await clientPage.screenshot({
      path: "screenshots/actual-client-reconnected.png",
    });
    console.log("[Test] Captured: actual-client-reconnected.png");
  });
});
