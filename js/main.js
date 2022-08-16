/*
*
*/



let device = null;
let format = null;
let wglsShader = loadFile('/shaders/shader.c');
// let wglsShader = {};
// wglsShader.vertex = loadFile('/shaders/vertex.c');
// wglsShader.fragment = loadFile('/shaders/fragment.c');
let imageBitmap = null;

async function initializeWebGPU() {
  //Проверяем поддержку WebGPU
  if(!('gpu' in navigator)) {
    console.error('Ваш браузер не поддерживает WebGPU.');
    return false;
  }

  //Получаем графический адаптер
  const adapter = await navigator.gpu.requestAdapter();
  if(!adapter) {
    console.error('Графические адаптеры не найдены.');
    return false;
  }

  //цветовой формат графического адаптера
  format = navigator.gpu.getPreferredCanvasFormat(adapter);

  //Получаем графическое устройство
  device = await adapter.requestDevice();
  device.lost.then((info) => {
    console.error(`Графическое устройство было потеряно: ${info.message}`);
    device = null;
    //Если графическое устройство было потеряно,
    //снова получаем графическое устройство
    if(info.reason != 'destroyed'){
      initializeWebGPU();
    }
  });

  //Begin creating WebGPU resources
  var t1 = performance.now();
  await onWebGPUInitialized();
  var t2 = performance.now();
	console.log(t2-t1);
  return true;
}

async function onWebGPUInitialized() {
  //texture
  let img = new Image();
  //img.src = 'earth.jpg';
  img.src = 'texture.jpg';
  //img.src = 'uv.jpg';
  await img.decode();
  imageBitmap = await createImageBitmap(img);
  //console.log(imageBitmap);

  //await WebGPU.Engine.createModels();
}

// Загрузка текста из файла.
function loadFile(url) {
	var request = new XMLHttpRequest();
	request.open('GET', url, false);
	request.send(null);
	if (request.status === 200) {
		return request.responseText;
	}
}

initializeWebGPU();
