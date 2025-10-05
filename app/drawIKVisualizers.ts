import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
} from "three";

export function drawIKVisualizers(
  linkTransforms: { position: Vector3; quaternion: Quaternion }[],
  jointTransforms: { position: Vector3; quaternion: Quaternion }[],
  linkVisualizersRef: Group | null,
  jointVisualizersRef: Group | null
) {
  //update link visualizers
  //create each one if it doesn't exist, and update it if it does
  for (const transform of linkTransforms) {
    const linkChildren = linkVisualizersRef?.children;
    if (linkChildren) {
      //adjust count of linkChildren to match transforms
      if (linkChildren.length !== linkTransforms.length) {
        for (let i = 0; i < linkTransforms.length; i++) {
          if (i >= linkChildren.length) {
            const extra = 0.1; //(i+1);
            const mesh = new Mesh(
              new BoxGeometry(0.1 * extra, 0.1 * extra, 0.1 * extra)
            );
            mesh.material = new MeshStandardMaterial({ color: 0xbbbbbb });
            linkChildren.push(mesh);
          }
        }
      }
      for (let i = 0; i < linkTransforms.length; i++) {
        linkChildren[i].position.copy(linkTransforms[i].position);
        linkChildren[i].quaternion.copy(linkTransforms[i].quaternion);
      }
    }
  }

  for (const transform of jointTransforms) {
    const jointChildren = jointVisualizersRef?.children;
    if (jointChildren) {
      //adjust count of jointChildren to match jointTransforms
      if (jointChildren.length !== jointTransforms.length) {
        for (let i = 0; i < jointTransforms.length; i++) {
          if (i >= jointChildren.length) {
            const mesh = new Mesh(new SphereGeometry(0.2, 10, 10));
            mesh.material = new MeshStandardMaterial({
              color: 0x00ffff,
              opacity: 0.5,
              transparent: true,
            });
            const factor = 0.3;
            mesh.scale.set(0.3 * factor, 1.0 * factor, 0.3 * factor);
            jointChildren.push(mesh);
          }
        }
      }
      for (let i = 0; i < jointTransforms.length; i++) {
        jointChildren[i].position.copy(jointTransforms[i].position);
        jointChildren[i].quaternion.copy(jointTransforms[i].quaternion);
      }
    }
  }
}
