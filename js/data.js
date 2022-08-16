let objects = {
  flower_1: {
    model: 'flower',
  },
  //...
};

let models = {
  flower: {
    type: 'gltf',
    url: '/webgpu/models/flower',
    move: {
      scale: [0.01,0.01,0.01],
      trans: [0,-0.7,-2]
    },

  },
  earth: {
    type: 'gltf',
    url: '/webgpu/models/flower_medium',
    move: {
      scale: [0.01,0.01,0.01],
      trans: [0,-0.7,-2]
    },
  },
  //...

};
