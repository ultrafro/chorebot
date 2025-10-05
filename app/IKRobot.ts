import { Scene, Group, Vector3, Quaternion, Object3D } from "three";
import { URDFRobot, URDFVisual } from "urdf-loader";
import { DOF, Goal, Joint, Link, setUrdfFromIK, Solver } from "closed-chain-ik";

export class IKRobot {
  scene: Scene;
  jointVisualizerGroup: Group;
  linkVisualizerGroup: Group;
  urdfRobot: URDFRobot;
  ikRobot: Link | Joint;
  gripperLink: Link;
  skeletonList: (Link | Joint)[];
  visualSkeletonList: URDFVisual[];

  goal: Goal;

  solver: Solver;

  constructor(
    scene: Scene,
    jointVisualizerGroup: Group,
    linkVisualizerGroup: Group,
    urdfRobot: URDFRobot,
    ikRobot: Link | Joint
  ) {
    this.goal = new Goal();
    this.scene = scene;
    this.jointVisualizerGroup = jointVisualizerGroup;
    this.linkVisualizerGroup = linkVisualizerGroup;
    this.urdfRobot = urdfRobot;

    // this.ikRobot = ikRobot.children[0] as Link;
    this.ikRobot = ikRobot;

    //clear the DOF of the ikRobot
    (this.ikRobot as Joint).setDoF();

    //set the quaternion of the ikRobot so that Up is Y
    let quaternion = new Quaternion();
    //rotate around x by 90 degrees
    quaternion.setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);

    //then rotate around y by 90 degrees
    const yrotator = new Quaternion();
    yrotator.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
    quaternion = yrotator.multiply(quaternion);

    //quaternion.setFromAxisAngle(new Vector3(1, 0, 1), Math.PI / 2);
    (this.ikRobot as Joint).setQuaternion(
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w
    );

    this.skeletonList = [];
    this.walkRobotTree(this.ikRobot, this.skeletonList);
    this.visualSkeletonList = [];
    // this.walkRobotTree(this.urdfRobot, this.visualSkeletonList);
    console.log(this.skeletonList);
    this.gripperLink = this.skeletonList.find(
      (link) => link.name === "gripper_frame_link"
    ) as Link;
    console.log("gripper link: ", this.gripperLink);

    //loop through the skeleton list, and set the DOF of each joint to be DOF.X
    // for (const joint of this.skeletonList) {
    //   if (joint instanceof Joint) {
    //     joint.setDoF(DOF.X);
    //   }
    // }

    //this.goal.setGoalDoF(DOF.X, DOF.Y, DOF.Z, DOF.EX, DOF.EY, DOF.EZ);
    this.goal.setGoalDoF(DOF.X, DOF.Y, DOF.Z);
    this.gripperLink.getWorldPosition(
      this.goal.position as unknown as number[]
    );
    this.gripperLink.getWorldQuaternion(
      this.goal.quaternion as unknown as number[]
    );

    this.goal.makeClosure(this.gripperLink);

    this.solver = new Solver(this.ikRobot);
    this.solver.maxIterations = 10;
    this.solver.divergeThreshold = 0.005;
    this.solver.stallThreshold = 1e-3;
    this.solver.translationErrorClamp = 0.25;
    this.solver.translationConvergeThreshold = 1e-3;
    this.solver.restPoseFactor = 0.001;
  }

  walkRobotTree(
    link: Link | Joint | URDFVisual,
    list: (Link | Joint | URDFVisual)[]
  ) {
    for (const child of link.children) {
      list.push(child as Link | Joint);
      this.walkRobotTree(child as Link | Joint | URDFVisual, list);
    }
  }

  setGoalTransform(position: Vector3, quaternion: Quaternion) {
    this.goal.setPosition(position.x, position.y, position.z);
    this.goal.setQuaternion(
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w
    );
  }

  lastTime = 0;
  update() {
    const start = performance.now();
    this.solver.solve();
    this.ikRobot.updateMatrixWorld();
    const end = performance.now();

    setUrdfFromIK(this.urdfRobot, this.ikRobot as Link);

    const now = performance.now();
    if (now - this.lastTime > 1000) {
      this.lastTime = now;
      //loop through ik values, if it is a joint with DOF, print the dof value
      for (const element of this.skeletonList) {
        if (element instanceof Joint && element.dof.length > 0) {
          console.log(((element as any).dofValues[5] * 180) / Math.PI);
        }
      }
    }
  }

  getJointTransforms() {
    const transforms: { position: Vector3; quaternion: Quaternion }[] = [];
    const joints = this.skeletonList.filter(
      (link) => link instanceof Joint
    ) as Joint[];
    //const joints = [this.joint1];
    for (const joint of joints) {
      const position = new Vector3();
      const quaternion = new Quaternion();
      const linkObject = new Object3D();
      const nums = joint.matrixWorld as unknown as number[];
      linkObject.matrix
        .set(
          nums[0],
          nums[1],
          nums[2],
          nums[3],
          nums[4],
          nums[5],
          nums[6],
          nums[7],
          nums[8],
          nums[9],
          nums[10],
          nums[11],
          nums[12],
          nums[13],
          nums[14],
          nums[15]
        )
        .transpose();
      //   linkObject.updateMatrix();
      linkObject.matrix.decompose(position, quaternion, new Vector3());

      // const position = new Vector3();
      // const quaternion = new Quaternion();
      // const positionArr = new Array(3);
      // const quaternionArr = new Array(4);
      // joint.getWorldPosition(positionArr);
      // joint.getWorldQuaternion(quaternionArr);
      // position.set(positionArr[0], positionArr[1], positionArr[2]);
      // quaternion.set(
      //   quaternionArr[0],
      //   quaternionArr[1],
      //   quaternionArr[2],
      //   quaternionArr[3]
      // );
      // joint.getWorldPosition(position);
      // joint.getWorldQuaternion(quaternion);
      transforms.push({ position, quaternion });
    }
    return transforms;
  }

  getLinkTransforms() {
    //loop through links, and return a position and quaternion for each link
    const transforms: { position: Vector3; quaternion: Quaternion }[] = [];
    const links = this.skeletonList.filter(
      (link) => link instanceof Link
    ) as Link[];
    //const links = [this.link1, this.link2];
    for (const link of links) {
      const position = new Vector3();
      const quaternion = new Quaternion();
      const linkObject = new Object3D();
      const nums = link.matrixWorld as unknown as number[];
      linkObject.matrix
        .set(
          nums[0],
          nums[1],
          nums[2],
          nums[3],
          nums[4],
          nums[5],
          nums[6],
          nums[7],
          nums[8],
          nums[9],
          nums[10],
          nums[11],
          nums[12],
          nums[13],
          nums[14],
          nums[15]
        )
        .transpose();
      //   linkObject.updateMatrix();
      linkObject.matrix.decompose(position, quaternion, new Vector3());
      transforms.push({ position, quaternion });
    }
    return transforms;
  }
}
