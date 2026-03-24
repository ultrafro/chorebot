import { Solver, Joint, Link, Goal } from "closed-chain-ik";
import { Object3D, Quaternion, Vector3 } from "three";
import { DOF } from "./IKRobot";
export class IKTest {
  goal: Goal;
  link1: Link;
  joint1: Joint;
  link2: Link;
  joint2: Joint;
  link3: Link;
  solver: Solver;

  constructor() {
    // Create links and joints
    this.link1 = new Link();

    this.joint1 = new Joint();
    this.joint1.setDoF(DOF.EY);
    this.joint1.setDoFValues(0);

    this.link2 = new Link();

    this.joint2 = new Joint();
    this.joint2.setDoF(DOF.EZ);
    this.joint2.setDoFValues(0);

    this.link3 = new Link();

    //construct:
    this.link1.addChild(this.joint1);
    this.joint1.addChild(this.link2);
    this.link2.addChild(this.joint2);
    this.joint2.addChild(this.link3);

    this.link1.setWorldPosition(0, 0, 0);

    this.joint1.setWorldPosition(0, 0, 0);
    this.link2.setWorldPosition(0, 1.0, 0);

    this.joint2.setWorldPosition(0, 1.0, 0);
    this.link3.setWorldPosition(0, 2.0, 0);

    this.goal = new Goal();

    this.goal.setGoalDoF(DOF.X, DOF.Y, DOF.Z);
    this.goal.makeClosure(this.link3);

    // create solver
    this.solver = new Solver(this.link1);
    this.solver.maxIterations = 10;
    this.solver.divergeThreshold = 0.005;
    this.solver.stallThreshold = 1e-3;
    this.solver.translationErrorClamp = 0.25;
    this.solver.translationConvergeThreshold = 1e-3;
    this.solver.restPoseFactor = 0.001;
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

  getJointValues() {
    return null;
  }

  getJointTransforms() {
    const transforms: { position: Vector3; quaternion: Quaternion }[] = [];
    const joints = [this.joint1, this.joint2];
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
      linkObject.matrix.decompose(position, quaternion, new Vector3());
      transforms.push({ position, quaternion });
    }
    return transforms;
  }

  getLinkTransforms() {
    const transforms: { position: Vector3; quaternion: Quaternion }[] = [];
    const links = [this.link1, this.link2, this.link3];
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
      linkObject.matrix.decompose(position, quaternion, new Vector3());
      transforms.push({ position, quaternion });
    }
    return transforms;
  }

  update() {
    this.solver.solve();
    this.link1.updateMatrixWorld();
  }
}
