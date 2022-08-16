/**
* Библиотека WebGPU
*/
(function (root, factory) {
if (typeof define === 'function' && define.amd) define([], factory);
else root.WebGPU = factory.call(root);
}(this, function() {
'use strict';

const devicePixelRatio = window.devicePixelRatio || 1;
//
class Scene {
  static scenes = {};
  canvasInfo = {
    id: undefined,
    canvas: undefined,
    context: undefined,
    renderTarget: undefined,
    renderTargetView: undefined,
    depthTexture: undefined,
    depthTextureView: undefined,
    renderPassDescriptor: undefined,
    sampleCount: 4,
  };
  renderInfo = {
    startTime: null, //начальное время
    time: 0, //текущее время
    lastTimeStamp: 0, //время последнего кадра
    visibleRenderInfo: false, // показать фпс и время анимации
    countFrames: 0, //кол-во кадров для подсчета фпс
    lastFpsTimeStamp: 0, //время последнего измерения фпс
    status: 'stop',
  };

  objects = {};
  obj = {};

  uniformBindGroup= null;
  pipeline = null;

  //конструктор класса
  constructor(canvasId){
    //добавляем сцену в список сцен
    this.canvasInfo.id = canvasId;
    Scene.scenes[canvasId] = this;
    //получаем canvas и context
    this.canvasInfo.canvas = document.getElementById(canvasId);
    this.canvasInfo.context = this.canvasInfo.canvas.getContext('webgpu');
    //делаем размер canvas согласно css
    this.canvasInfo.canvas.width = this.canvasInfo.canvas.clientWidth * devicePixelRatio;
    this.canvasInfo.canvas.height = this.canvasInfo.canvas.clientHeight * devicePixelRatio;
    //конфигурация context
    this.canvasInfo.context.configure({
      device: device,
      format: format,
      alphaMode: 'opaque',
    });
    //текстура глубины для renderPassDescriptor
    this.canvasInfo.depthTexture = device.createTexture({
      size: [this.canvasInfo.canvas.width, this.canvasInfo.canvas.height],
      format: 'depth24plus',
      sampleCount: this.canvasInfo.sampleCount,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.canvasInfo.depthTextureView = this.canvasInfo.depthTexture.createView();
    //renderPassDescriptor
    this.canvasInfo.renderPassDescriptor = {
      colorAttachments: [{
        view: undefined,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
        resolveTarget: undefined,
      }],
      depthStencilAttachment: {
        view: this.canvasInfo.depthTextureView,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    };
  }

  //??? пока непонятно как
  static destroy(object){

    // if(typeof object === 'object' && object !== null){
    //   if(object.hasOwnProperty('canvasInfo')) delete Scene.scenes[object.canvasInfo.id];
    //   for (var variable in object) {
    //     if(object.hasOwnProperty(variable)) {
    //       //Scene.destroy(object[variable]);
    //       object[variable] = null;
    //       //if(typeof object[variable] === 'object' && object[variable] !== null) delete object[variable];
    //       console.log(variable);
    //       console.log(object[variable]);
    //     }
    //   }
    // }
  }

  //цикл отрисовки
  runRenderLoop(){
    if (this.renderInfo.startTime === null) this.renderInfo.startTime = performance.now();
    this.renderInfo.time = performance.now() - this.renderInfo.startTime;
    this.renderInfo.lastTimeStamp = this.renderInfo.time;
    // показать фпс и показать время
    this.computeFps();
    //обновляем размеры canvas
    this.resizeCanvas();
    //рисуем
    this.draw(this.renderInfo.time);
    // зацикливаем
    requestAnimationFrame(() => this.runRenderLoop());
  }

  // метод расчета fps
  computeFps() {
    this.renderInfo.countFrames += 1;
    if(this.renderInfo.time - this.renderInfo.lastFpsTimeStamp >= 1000) {
      this.renderInfo.lastFpsTimeStamp = this.renderInfo.time;
      if (this.renderInfo.visibleRenderInfo === true) document.getElementById("game-fps").innerHTML = 'Fps: ' + this.renderInfo.countFrames + ' Hz';
      this.renderInfo.countFrames = 0;
    }

    //else {
      //this.renderInfo.countFrames += 1;
    //}

    // let div = document.createElement('div');
    // div.id = "alert";
    // div.innerHTML = "<strong>Всем привет!</strong> Вы прочитали важное сообщение.";
    // document.body.append(div);
    // div.remove();
    // document.body.append(div);
    if (this.renderInfo.visibleRenderInfo === true) document.getElementById("game-time").innerHTML = 'Time: ' + (this.renderInfo.time/1000).toFixed(1) + ' s';
  }
  //
  initBuffers(){
    //x y z w   r g b a
    // const vertices = new Float32Array([
    //   -1.0, -1.0, 0.9, 1,   1, 0, 0, 1,
    //   -0.3, 1.0, 0.9, 1,    0, 1, 0, 1,
    //   1.0, -0.3, 1.1, 1,    0, 0, 1, 1,
    // ]);
  //   const x = 0.2;
  //   const y = 0.3;
  //   const z = 0.5;
  //   const vertices2 = new Float32Array([
  //     // лицевая часть
  //     -x, -y, z,
  //     -x, y, z,
  //     x, y, z,
  //     x, -y, z,
  //     // задняя часть
  //     -x, -y, -z,
  //     -x, y, -z,
  //     x, y, -z,
  //     x, -y, -z,
  //     // левая боковая часть
  //     -x, -y, z,
  //     -x, y, z,
  //     -x, y, -z,
  //     -x, -y, -z,
  //     // правая боковая часть
  //     x, -y, z,
  //     x, y, z,
  //     x, y, -z,
  //     x, -y, -z,
  //     // верхняя часть
  //     -x, y, z,
  //     -x, y, -z,
  //     x, y, -z,
  //     x, y, z,
  //     // нижняя часть
  //     -x, -y, z,
  //     -x, -y, -z,
  //     x, -y, -z,
  //     x, -y, z,
  //   ]);
  //   const vertices = new Float32Array([
  //     // лицевая часть
  //     -x, -y, z, 0, 0,
  //     -x, y, z, 0, 1,
  //     x, y, z, 1, 1,
  //     x, -y, z, 1, 0,
  //     // задняя часть
  //     -x, -y, -z, 0, 0,
  //     -x, y, -z, 0, 1,
  //     x, y, -z, 1, 1,
  //     x, -y, -z, 1, 0,
  //     // левая боковая часть
  //     -x, -y, z, 0, 0,
  //     -x, y, z, 0, 1,
  //     -x, y, -z, 1, 1,
  //     -x, -y, -z, 1, 0,
  //     // правая боковая часть
  //     x, -y, z, 0, 0,
  //     x, y, z, 0, 1,
  //     x, y, -z, 1, 1,
  //     x, -y, -z, 1, 0,
  //     // верхняя часть
  //     -x, y, z, 0, 0,
  //     -x, y, -z, 0, 1,
  //     x, y, -z, 1, 1,
  //     x, y, z, 1, 0,
  //     // нижняя часть
  //     -x, -y, z, 0, 0,
  //     -x, -y, -z, 0, 1,
  //     x, -y, -z, 1, 1,
  //     x, -y, z, 1, 0,
  //   ]);
  //   {
  //   // const texcoord = new Float32Array([
  //   //   // //1
  //   //   0, 0,
  //   //   0, 1,
  //   //   1, 1,
  //   //   1, 0,
  //   //   //2
  //   //   0, 0,
  //   //   0, 1,
  //   //   1, 1,
  //   //   1, 0,
  //   //   //3
  //   //   0, 0,
  //   //   0, 1,
  //   //   1, 1,
  //   //   1, 0,
  //   //   //4
  //   //   0, 0,
  //   //   0, 1,
  //   //   1, 1,
  //   //   1, 0,
  //   //   //5
  //   //   0, 0,
  //   //   0, 1,
  //   //   1, 1,
  //   //   1, 0,
  //   //   //6
  //   //   0, 0,
  //   //   0, 1,
  //   //   1, 1,
  //   //   1, 0,
  //   // ]);
  // }
  //   const index = new Uint32Array([
  //     // лицевая часть
  //     0, 1, 2,
  //     2, 3, 0,
  //     // задняя часть
  //     4, 5, 6,
  //     6, 7, 4,
  //     //левая боковая часть
  //     8, 9, 10,
  //     10, 11, 8,
  //     // правая боковая часть
  //     12, 13, 14,
  //     14, 15, 12,
  //     // верхняя часть
  //     19, 18, 17,
  //     17, 16, 19,
  //     // нижняя часть
  //     23, 22 ,21,
  //     21, 20 ,23,
  //   ]);
  //   this.indexLength = index.length;
  //
  //   const texcoord = new Float32Array([
  // 		// //1
  // 		0, 0,
  // 		0, 1,
  // 		1, 1,
  // 		1, 0,
  // 		//2
  // 		0, 0,
  // 		0, 1,
  // 		1, 1,
  // 		1, 0,
  // 		//3
  // 		0, 0,
  // 		0, 1,
  // 		1, 1,
  // 		1, 0,
  // 		//4
  // 		0, 0,
  // 		0, 1,
  // 		1, 1,
  // 		1, 0,
  // 		//5
  // 		0, 0,
  // 		0, 1,
  // 		1, 1,
  // 		1, 0,
  // 		//6
  // 		0, 0,
  // 		0, 1,
  // 		1, 1,
  // 		1, 0,
  // 	]);



    // //создаем буфер
    // this.vertexBuffer = device.createBuffer({
    //   size: vertices2.byteLength,
    //   usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    //   mappedAtCreation: true,
    // });
    // new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices2);
    // this.vertexBuffer.unmap();
    // //
    // //создаем буфер
    // this.vertexBuffer2 = device.createBuffer({
    //   size: texcoord.byteLength,
    //   usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    //   mappedAtCreation: true,
    // });
    // new Float32Array(this.vertexBuffer2.getMappedRange()).set(texcoord);
    // this.vertexBuffer2.unmap();
    // //
    // this.indexBuffer = device.createBuffer({
    //   size: index.byteLength,
    //   usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    //   mappedAtCreation: true
    // });
    // new Uint32Array(this.indexBuffer.getMappedRange()).set(index);
    // //this.indexBuffer.getMappedRange().set(this.index);
    // this.indexBuffer.unmap();


    //
    const vertexBuffersDescriptors = [
          {
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x3",
              },
            ],
            arrayStride: 12,
            //stepMode: "vertex", //адрес увеличивается для каждой вершины на arrayStride байт
          },
          {
            attributes: [
              {
                shaderLocation: 1,
                offset: 0,
                format: "float32x2",
              },
            ],
            arrayStride: 8,
            //stepMode: "vertex", //адрес увеличивается для каждой вершины на arrayStride байт
          },
        ];

        //
    this.pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: device.createShaderModule({
                    code: wglsShader
                }),
                entryPoint: "vertex_main",
                buffers: vertexBuffersDescriptors,
            },
            fragment: {
                module: device.createShaderModule({
                    code: wglsShader
                }),
                entryPoint: "fragment_main",
                targets: [{
                    format: format
                }]
            },
            primitive:{
               topology: "triangle-list",
               //cullMode: 'back',
            },
            multisample:{
               count: this.canvasInfo.sampleCount,
            },
            depthStencil: {
              depthWriteEnabled: true,
              depthCompare: 'less',
              format: 'depth24plus',
            },
        });

{
    //////////
    //
    //////////

    // Создаем sampler с параметрами обработки текстуры
    const sampler = device.createSampler({
      minFilter:'linear',
      magFilter:'linear',
      mipmapFilter : "linear", //nearest ???
      addressModeU: 'repeat',
      addressModeV: 'repeat',
      //maxAnisotropy: 16,
    });
    // Создаем саму текстуру
    //console.log(imageBitmap.width);
    const texture = device.createTexture({
      size:[imageBitmap.width,imageBitmap.height,1], //??
      format:format,
      usage: GPUTextureUsage.TEXTURE_BINDING |
             GPUTextureUsage.COPY_DST |
             GPUTextureUsage.RENDER_ATTACHMENT
    });

    //передаем данные о текстуре и данных текстуры в очередь
    device.queue.copyExternalImageToTexture(
      {source: imageBitmap},
      {texture: texture},
      [imageBitmap.width,imageBitmap.height]);


//////////////////////////////////////
    this.MODELMATRIX = m4.identity();
    //this.MODELMATRIX = m4.xRotate(this.MODELMATRIX, -1.0);
    //this.MODELMATRIX = m4.yRotate(this.MODELMATRIX, 0);
    //this.MODELMATRIX = m4.zRotate(this.MODELMATRIX, 1.2);
    //console.log(Model.models.earth);
    this.MODELMATRIX = m4.scale(this.MODELMATRIX, ...this.obj.move.scale);
    //scale(m, sx, sy, sz, dst)

    this.PROJMATRIX = m4.identity();
    m4.perspective(1, this.canvasInfo.canvas.width/this.canvasInfo.canvas.height, 0.1, 25, this.PROJMATRIX);

    this.VIEWMATRIX = m4.identity();
    this.VIEWMATRIX = m4.translate(this.VIEWMATRIX, ...this.obj.move.trans);


    ///
    //create uniform buffer and layout
    this.uniformBuffer = device.createBuffer({
        size: 64+64+64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.uniformBindGroup = device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [{
            binding: 0,
            resource: {
                buffer: this.uniformBuffer,
                //offset: 0,
                //size: 4 // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
            }
          },
          {
            binding: 1,
            resource: sampler
          },
          {
            binding: 2,
            resource: texture.createView()
          }
        ]
    });
    //
    // let a = new Float32Array([1.0]);
    // device.queue.writeBuffer(this.uniformBuffer, 0, a); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(this.uniformBuffer, 0, this.MODELMATRIX);
    device.queue.writeBuffer(this.uniformBuffer, 64, this.PROJMATRIX);
    device.queue.writeBuffer(this.uniformBuffer, 64+64, this.VIEWMATRIX);

}
  }

  resizeCanvas(){
    const {
      canvas,
      renderTarget,
      depthTexture,
      sampleCount,
    } = this.canvasInfo;
    const width = Math.min(device.limits.maxTextureDimension2D, canvas.clientWidth);
    const height = Math.min(device.limits.maxTextureDimension2D, canvas.clientHeight);

    const needResize = !this.canvasInfo.renderTarget ||
                       width !== canvas.width ||
                       height !== canvas.height;

    if (needResize) {
      if (renderTarget) {
        renderTarget.destroy();
      }
      if (depthTexture) {
        depthTexture.destroy();
      }

      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;

      if (sampleCount > 1) {
        const newRenderTarget = device.createTexture({
          size: [canvas.width, canvas.height],
          format: format,
          sampleCount,
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.canvasInfo.renderTarget = newRenderTarget;
        this.canvasInfo.renderTargetView = newRenderTarget.createView();
      }

      const newDepthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        sampleCount,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
      this.canvasInfo.depthTexture = newDepthTexture;
      this.canvasInfo.depthTextureView = newDepthTexture.createView();
    }
  }
  //
  draw(time) {

    //this.MODELMATRIX = m4.xRotate(this.MODELMATRIX, 0.01);
    this.MODELMATRIX = m4.yRotate(this.MODELMATRIX, 0.005);
    //this.MODELMATRIX = m4.zRotate(this.MODELMATRIX, 0.001);

    m4.perspective(1, this.canvasInfo.canvas.width/this.canvasInfo.canvas.height, 0.1, 25, this.PROJMATRIX);

    device.queue.writeBuffer(this.uniformBuffer, 0, this.MODELMATRIX);
    device.queue.writeBuffer(this.uniformBuffer, 64, this.PROJMATRIX);

      if(this.canvasInfo.sampleCount > 1) {
        this.canvasInfo.renderPassDescriptor.colorAttachments[0].view = this.canvasInfo.renderTargetView;
        this.canvasInfo.renderPassDescriptor.colorAttachments[0].resolveTarget = this.canvasInfo.context.getCurrentTexture().createView();
        this.canvasInfo.renderPassDescriptor.depthStencilAttachment.view = this.canvasInfo.depthTextureView;
      }
      else {
        this.canvasInfo.renderPassDescriptor.colorAttachments[0].view = this.canvasInfo.context.getCurrentTexture().createView();
        this.canvasInfo.renderPassDescriptor.colorAttachments[0].resolveTarget = undefined;
        this.canvasInfo.renderPassDescriptor.depthStencilAttachment.view = this.canvasInfo.depthTextureView;
      }

      const commandEncoder = device.createCommandEncoder();
      const renderPass = commandEncoder.beginRenderPass(this.canvasInfo.renderPassDescriptor);




      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.uniformBindGroup);
      //renderPass.setVertexBuffer(0, this.vertexBuffer);
      //renderPass.setVertexBuffer(1, this.vertexBuffer2);
      //console.log(this.obj);
      renderPass.setVertexBuffer(0, this.obj.positionBuffer);
      renderPass.setVertexBuffer(1, this.obj.texcoordBuffer);
      //renderPass.setIndexBuffer(this.indexBuffer, "uint32");
      renderPass.setIndexBuffer(this.obj.indexBuffer, this.obj.indexFormat);
      //console.log(this.indexBuffer);
      //console.log(this.indexLength);
      renderPass.drawIndexed(this.obj.indexCount);
      //renderPass.drawIndexed(this.indexBuffer.size);
      //renderPass.draw(3, 1, 0, 0);
      renderPass.end();
      device.queue.submit([commandEncoder.finish()]);
  }

};

class Model {
  static models = {};

  static async initModels(models) {
    for (var modelName in models) {
      console.log(models[modelName]);
      switch (models[modelName].type) {
				case 'cube':
					//..
					break;
				case 'gltf':
					this.models[modelName] = await Promise.resolve(GLTF.initGLTF(models[modelName]));
          this.models[modelName].meshes[0].primitives[0].move =models[modelName].move;
					break;
				default:
					//...
			}
    }
  }

  //создать новую модель
  static async createModel(name){
    //
  }
};
//
	return {
		Scene: Scene,
    Model: Model,
    //
	}
}));
