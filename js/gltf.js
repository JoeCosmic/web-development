/**
* GLTF библиотека для работы с файлами gltf
*/
(function (root, factory) {
	if (typeof define === 'function' && define.amd) define([], factory);
	else root.GLTF = factory.call(root);
}(this, function() {
  'use strict';

//.................константы.................//
//!!!??? важно иметь все необходимые аттрибуты, иначе они пойдут в POSITION
const attributeType = { //локации атрибутов
	'POSITION': 0,
	'NORMAL': 1,
	'TEXCOORD_0': 2,
	'TANGENT': 3,
	'JOINTS_0': 4,
	'WEIGHTS_0': 5,
	'COLOR_0': 6,
	// 'TEXCOORD_1': 7,
	// 'TEXCOORD_2': 8,
	// 'TEXCOORD_3': 9,
	// 'TEXCOORD_4': 10,
	// 'TEXCOORD_5': 11,
	// 'TEXCOORD_6': 12,
};
const accessorSizes = { //количество компонентов
		'SCALAR': 1,
		'VEC2': 2,
		'VEC3': 3,
		'VEC4': 4,
		'MAT2': 4,
		'MAT3': 9,
		'MAT4': 16
};

const indexFormats = {
	5123: 'uint16',
	5125: 'uint32'
};

//................Основные функции.................//
//создать gltf
async function initGLTF(modelInfo) {
	let gltf = null;
	let buffers = null;
	if(modelInfo.type === 'gltf') {
		var t1 = performance.now();
		//load gltf
		const response = await fetch(modelInfo.url + '/model.gltf');
		gltf = await response.json();
		//check accessors
		if (gltf.accessors === undefined || gltf.accessors.length === 0) {
				throw new Error('GLTF File is missing accessors');
		}
		//load bin buffers
		buffers = await Promise.all(gltf.buffers.map(async (buffer) => {
			const response = await fetch(modelInfo.url + '/' + buffer.uri);
			return await response.arrayBuffer();
		}));
		var t2 = performance.now();
		console.log(t2-t1);
	}
	else {
		gltf = modelInfo.gltf;
		buffers = modelInfo.buffers;
	}
	console.log(gltf);
	//load meshes

	let meshes = gltf.meshes.map(mesh => {
		let primitives = mesh.primitives.map(primitive => loadMesh(gltf, buffers, primitive));
		return {
			primitives: primitives,
			isSkin: 0,
		};
	});

	// //load materials
	// var materials = gltf.materials ? await Promise.all(gltf.materials.map(async (material) => await loadMaterial(gl, material, modelInfo.url, gltf))) : null;
	// //load rootNodes
	// var scene = gltf.scenes[gltf.scene || 0];
	// var rootNodes = scene.nodes;
	// //load nodes
	// var nodes = gltf.nodes.map((node, i) => loadNodes(i, node, meshes));
	// //compute meshes global matrices
	// rootNodes.forEach((rootNode) => {
	// 	computeGlobalMatrices(rootNode, nodes, m4.identity());
	// });
	// //load animation
	// var animations = gltf.animations !== undefined ? gltf.animations.map(animation => loadAnimation(gltf, animation, buffers)) : null;
	// //load skins
	// var skins = gltf.skins !== undefined ? gltf.skins.map(skin => loadSkin(gltf, skin, buffers)) : null;
	// //load program
	// var program = modelInfo.program;

	return {
		//program,
		meshes,
		// nodes,
		// rootNodes,
		// animations,
		// skins,
		// materials,
	};
}
//
function loadMesh(gltf, buffers, primitive) {
	let accessor = null;
	let indexAccessor = null;
	let indexFormat = null;
	let indexCount = null;
	let indexBufferInfo = null;
	let positionBufferInfo = null;
	let texcoordBufferInfo = null;

	if (primitive.indices !== undefined) {
		indexAccessor = gltf.accessors[primitive.indices];
		indexBufferInfo = createBuffer(gltf, buffers, indexAccessor, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST);
	}

	for (var attributeName in primitive.attributes) {
		if(attributeName == 'POSITION') {
			accessor = gltf.accessors[primitive.attributes[attributeName]];
			positionBufferInfo = createBuffer(gltf, buffers, accessor, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
		}
		if(attributeName == 'TEXCOORD_0') {
			accessor = gltf.accessors[primitive.attributes[attributeName]];
			texcoordBufferInfo = createBuffer(gltf, buffers, accessor, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
		}
	}

	//
	return {
		indexFormat: indexFormats[indexBufferInfo.componentType],
		indexCount: indexAccessor.count,
		indexBuffer: indexBufferInfo.buffer,
		positionBuffer: positionBufferInfo.buffer,
		texcoordBuffer: texcoordBufferInfo.buffer,
		mode: primitive.mode || 4,
		material: primitive.material,
	};
}
////////
function createBuffer(gltf, buffers, accessor, usage) {
	const bufferView = gltf.bufferViews[accessor.bufferView];
	const size = accessorSizes[accessor.type]; //1,2,3,4,...
	const count = accessor.count; //count vertex
	const componentType = accessor.componentType; //int/float/uint/8/16/32
	const type = accessor.type; //vec2/3/4 scalar => size 1,2,3,4,...
	let data = null; //byteLength = count*size or bufferView.byteLength
	let buffer = null;
	let length = null;

	switch (componentType) {
		case 5120:
			data = new Int8Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), count * size);
			//
			buffer = device.createBuffer({
				size: data.byteLength,
				usage: usage,
				mappedAtCreation: true
			});
			new Int8Array(buffer.getMappedRange()).set(data);
			buffer.unmap();
			//
			break;
		case 5121:
			data = new Uint8Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), count * size);
			//
			buffer = device.createBuffer({
				size: data.byteLength,
				usage: usage,
				mappedAtCreation: true
			});
			new Uint8Array(buffer.getMappedRange()).set(data);
			buffer.unmap();
			//
			break;
		case 5122:
			data = new Int16Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), count * size);
			//
			buffer = device.createBuffer({
				size: data.byteLength,
				usage: usage,
				mappedAtCreation: true
			});
			new Int16Array(buffer.getMappedRange()).set(data);
			buffer.unmap();
			//
			break;
		case 5123:
			data = new Uint16Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), count * size);
			//
			buffer = device.createBuffer({
				size: data.byteLength,
				usage: usage,
				mappedAtCreation: true
			});
			new Uint16Array(buffer.getMappedRange()).set(data);
			buffer.unmap();
			//
			break;
		case 5125:
			data = new Uint32Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), count * size);
			//
			buffer = device.createBuffer({
				size: data.byteLength,
				usage: usage,
				mappedAtCreation: true
			});
			new Uint32Array(buffer.getMappedRange()).set(data);
			buffer.unmap();
			//
			break;
		case 5126:
			data = new Float32Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), count * size);
			//
			buffer = device.createBuffer({
				size: data.byteLength,
				usage: usage,
				mappedAtCreation: true
			});
			new Float32Array(buffer.getMappedRange()).set(data);
			buffer.unmap();
			//
			break;
	}

	return {
			buffer,
			type,
			size,
			componentType,
	};
}
////////////////////
//
function loadMesh2(gl, gltf, primitive, buffers) {
	var indices = null;
	var indexElements = false;
	var elementCount = 0;
	var elementType = null;

	if (primitive.indices !== undefined) {
			//gltf
			if(Array.isArray(buffers)) {
				var indexAccessor = gltf.accessors[primitive.indices];
				var indexBuffer = readBufferFromFile(gltf, buffers, indexAccessor);

				indices = gl.createBuffer();
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.data, gl.STATIC_DRAW);

				////
				indices = device.createBuffer({
		      size: indexBuffer.data.byteLength,
		      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
		      mappedAtCreation: true
		    });
		    new Uint32Array(indices.getMappedRange()).set(indexBuffer.data);
		    indices.unmap();
				/////

				elementCount = indexBuffer.data.length;
				elementType = indexAccessor.componentType;
				indexElements = true;
			}
			//not gltf
			else {
				var indexAccessor = primitive.indices;
				var indexBuffer = buffers[indexAccessor];

				indices = gl.createBuffer();
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.data, gl.STATIC_DRAW);

				elementCount = indexBuffer.data.length;
				elementType = indexBuffer.componentType;
				indexElements = true;
			}
	}
	else {
		if(Array.isArray(buffers)) {
			var accessor = getAccessor(gltf, primitive, 'POSITION');
			elementCount = accessor.count;
		}
		else {
			var accessor = primitive.attributes.POSITION;
			elementCount = buffers[accessor].count;
		}
	}

	var attributes = {};
	for (var attributeName in primitive.attributes) {
		//
		if(attributeName == 'TEXCOORD_0' || attributeName == 'COLOR_0' || attributeName == 'JOINTS_0' || attributeName == 'WEIGHTS_0' || attributeName == 'POSITION' || attributeName == 'NORMAL' || attributeName == 'TANGENT') {
			if(Array.isArray(buffers)) {
				attributes[attributeName] = getBufferFromName(gl, gltf, buffers, primitive, attributeName);
			}
			else {
				var bufferData = buffers[primitive.attributes[attributeName]];
				const buffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
				gl.bufferData(gl.ARRAY_BUFFER, bufferData.data, gl.STATIC_DRAW);

				attributes[attributeName] = {
						buffer,
						size: bufferData.size,
						type: bufferData.componentType,
				};
			}
		}
	}

	//create VAO
	var vao = gl.createVertexArray();
	gl.bindVertexArray(vao);
	if(indices) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
	for (var attributeName in attributes) {
		var attribute = attributes[attributeName];
		var location = attributeType[attributeName];
		gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer);
		gl.enableVertexAttribArray(location);
		gl.vertexAttribPointer(location, attribute.size, attribute.type, false, 0, 0);
	}
	//close VAO
	gl.bindVertexArray(null);

	return {
			indices,
			indexElements,
			elementCount,
			elementType,
			vao,
			mode: primitive.mode || 4,
			material: primitive.material,
	};
}
//
async function loadMaterial(gl, material, url, gltf) {

	let baseColorTexture = null;
	let metallicRoughnessTexture = null;
	let emissiveTexture = null;
	let normalTexture = null;
	let occlusionTexture = null;

	let baseColorFactor = [1.0, 1.0, 1.0, 1.0];
	let roughnessFactor = 0.0;
	let metallicFactor = 1.0;
	let emissiveFactor = [1.0, 1.0, 1.0];

	const pbr = material.pbrMetallicRoughness;
	if (pbr) {
			if (pbr.baseColorTexture) {
					var texture = gltf.textures[pbr.baseColorTexture.index];
					var uri = gltf.images[texture.source].uri;
					var sampler = gltf.samplers !== undefined ? gltf.samplers[texture.sampler] : null;
					baseColorTexture = await getTexture(gl, `${url}/${uri}`, sampler);
			}
			if (pbr.baseColorFactor) {
					baseColorFactor = pbr.baseColorFactor;
			}
			if (pbr.metallicRoughnessTexture) {
					var texture = gltf.textures[pbr.metallicRoughnessTexture.index];
					var uri = gltf.images[texture.source].uri;
					var sampler = gltf.samplers !== undefined ? gltf.samplers[texture.sampler] : null;
					metallicRoughnessTexture = await getTexture(gl, `${url}/${uri}`, sampler);
			}
			metallicFactor = pbr.metallicFactor !== undefined ? pbr.metallicFactor : 1.0;
			roughnessFactor = pbr.roughnessFactor !== undefined ? pbr.roughnessFactor : 0.0;
	}

	if (material.emissiveTexture) {
			var texture = gltf.textures[material.emissiveTexture.index];
			var uri = gltf.images[texture.source].uri;
			var sampler = gltf.samplers !== undefined ? gltf.samplers[texture.sampler] : null;
			emissiveTexture = await getTexture(gl, `${url}/${uri}`, sampler);
	}
	if (material.normalTexture) {
			var texture = gltf.textures[material.normalTexture.index];
			var uri = gltf.images[texture.source].uri;
			var sampler = gltf.samplers !== undefined ? gltf.samplers[texture.sampler] : null;
			normalTexture = await getTexture(gl, `${url}/${uri}`, sampler);
	}
	if (material.occlusionTexture) {
			var texture = gltf.textures[material.occlusionTexture.index];
			var uri = gltf.images[texture.source].uri;
			var sampler = gltf.samplers !== undefined ? gltf.samplers[texture.sampler] : null;
			occlusionTexture = await getTexture(gl, `${url}/${uri}`, sampler);
	}
	if (material.emissiveFactor) {
			emissiveFactor = material.emissiveFactor;
	}

	return {
		baseColorTexture,
		baseColorFactor,
		metallicRoughnessTexture,
		metallicFactor,
		roughnessFactor,
		emissiveTexture,
		emissiveFactor,
		normalTexture,
		occlusionTexture,
	};
}
//
function loadNodes(index, node, meshes) {
	var translation = node.translation !== undefined ? node.translation : [0, 0, 0];
	var rotation = node.rotation !== undefined ? node.rotation : [0, 0, 0, 1];
	var scale = node.scale !== undefined ? node.scale : [1, 1, 1];
	var transform = node.matrix !== undefined ? node.matrix : m4.compose(translation, rotation, scale);

	if(node.mesh !== undefined && node.skin !== undefined) meshes[node.mesh].isSkin = 1;

	return {
			id: index,
			name: node.name,
			children: node.children || [],
			localBindTransform: transform,
			animatedTransform: m4.identity(),
			skin: node.skin,
			mesh: node.mesh
	};
}
//
function loadAnimation(gltf, animation, buffers) {
	const channels = animation.channels.map(c => {
			const sampler = animation.samplers[c.sampler];
			const time = readBufferFromFile(gltf, buffers, gltf.accessors[sampler.input]);
			const buffer = readBufferFromFile(gltf, buffers, gltf.accessors[sampler.output]);

			return {
					node: c.target.node,
					type: c.target.path,
					time,
					buffer,
					interpolation: sampler.interpolation ? sampler.interpolation : 'LINEAR',
			};
	});
	//console.log(channels);

	const c = {};
	channels.forEach((channel) => {
			if (c[channel.node] === undefined) {
					c[channel.node] = {
							translation: [],
							rotation: [],
							scale: [],
					};
//!!!!					//c['count'] = channel.time.data.length;
			}

			for (let i = 0; i < channel.time.data.length; i ++) {
					const size = channel.interpolation === 'CUBICSPLINE' ? channel.buffer.size * 3 : channel.buffer.size;
					const offset = channel.interpolation === 'CUBICSPLINE' ? channel.buffer.size : 0;

					const transform = channel.type === 'rotation'
							? [
									channel.buffer.data[i * size + offset],
									channel.buffer.data[i * size + offset + 1],
									channel.buffer.data[i * size + offset + 2],
									channel.buffer.data[i * size + offset + 3]
							]
							: [
									channel.buffer.data[i * size + offset],
									channel.buffer.data[i * size + offset + 1],
									channel.buffer.data[i * size + offset + 2]
							];
					//
					// if(!transform) {
					// 	if(channel.type === 'translation') transform = [0, 0, 0];
					// 	if(channel.type === 'scale') transform = [1, 1, 1];
					// 	if(channel.type === 'rotation') transform = [0, 0, 0, 1];
					// }
					//
					c[channel.node][channel.type].push({
							time: channel.time.data[i],
							transform: transform,
							type: channel.type,
					})
			}
	});

	return c;
}
//
function loadSkin(gltf, skin, buffers) {
	const bindTransforms = readBufferFromFile(gltf, buffers, gltf.accessors[skin.inverseBindMatrices]);
	const inverseBindTransforms = skin.joints.map((_, i) => bindTransforms.data.slice(i * 16, i * 16 + 16));
	return {
			joints: skin.joints,
			inverseBindTransforms,
	};
}


function computeGlobalMatrices(nodeIndex, nodes, matrix) {
	var node = nodes[nodeIndex];
	matrix = m4.multiply(matrix, node.localBindTransform);
	if(node.mesh !== undefined) node.globalMatrix = matrix;
	node.children.forEach((childIndex) => {
		computeGlobalMatrices(childIndex, nodes, matrix)
	});
}

function getAccessor(gltf, primitive, attributeName) {
	const attribute = primitive.attributes[attributeName];
	return gltf.accessors[attribute];
}
function readBufferFromFile(gltf, buffers, accessor) {
	const bufferView = gltf.bufferViews[accessor.bufferView];
	const size = accessorSizes[accessor.type]; //1,2,3,4,...
	const count = accessor.count; //count vertex
	const componentType = accessor.componentType; //int/float/uint/8/16/32
	const type = accessor.type; //vec2/3/4 scalar => size 1,2,3,4,...
	//byteLength = count*size or bufferView.byteLength

	var data = null;
	switch (componentType) {
		case 5120:
			data = new Int8Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), count * size);
			break;
		case 5121:
			data = new Uint8Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), count * size);
			break;
		case 5122:
			data = new Int16Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), count * size);
			break;
		case 5123:
			data = new Uint16Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), count * size);
			break;
		case 5125:
			data = new Uint32Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), count * size);
			break;
		case 5126:
			data = new Float32Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), count * size);
			break;
	}

	return {
			size,
			data,
			type,
			componentType,
	};
}
function getBufferFromName(gl, gltf, buffers, primitive, name) {
	if (primitive.attributes[name] === undefined) {
			return null;
	}

	const accessor = getAccessor(gltf, primitive, name);
	const bufferData = readBufferFromFile(gltf, buffers, accessor);

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, bufferData.data, gl.STATIC_DRAW);

	return {
			buffer,
			size: bufferData.size,
			type: bufferData.componentType,
	};
}
async function getTexture(gl, uri, sampler) {
	return new Promise(resolve => {
		const img = new Image();
		img.onload = () => {
			if(!sampler) sampler = {
				wrapS: gl.REPEAT,
				wrapT: gl.REPEAT,
				minFilter: gl.LINEAR_MIPMAP_LINEAR,
				magFilter: gl.NEAREST,
			};
			const texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, sampler.wrapS);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, sampler.wrapT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, sampler.minFilter);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, sampler.magFilter);

			const ext = gl.getExtension('EXT_texture_filter_anisotropic');
			if (ext) {
				const max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
				gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, max);
			}

			gl.generateMipmap(gl.TEXTURE_2D);
			resolve(texture);
		}
		img.src = uri;
		img.crossOrigin = 'undefined';
	});
}

/////////////////////
/////////////////////////
/////////////////////

function setAnimationToNodes(gl, model, animation, time) {
	var t =Math.round(time/30);
	//console.log(t);
	for (var nodeIndex in model.animations[animation]) {
		var joint = model.animations[animation][nodeIndex];

		//
		var countT = joint.translation.length;
		//console.log(joint);
		//console.log(countT);
		var countR = joint.rotation.length;
		var countS = joint.scale.length;
		//
		var frameT = 0;
		var frameR = 0;
		var frameS = 0;
		if(countT !== 0) frameT = t % countT;
		if(countR !== 0) frameR = t % countR;
		if(countS !== 0) frameS = t % countS;
		//
		var translation = joint.translation[frameT] !== undefined ? joint.translation[frameT].transform : [0, 0, 0];
		var rotation = joint.rotation[frameR] !== undefined ? joint.rotation[frameR].transform : [0, 0, 0, 1];
		var scale = joint.scale[frameS] !== undefined ? joint.scale[frameS].transform : [1, 1, 1];
		model.nodes[nodeIndex].localBindTransform = m4.compose(translation, rotation, scale);
	}

	model.rootNodes.forEach((rootNode) => {
		computeGlobalMatrices(rootNode, model.nodes, m4.identity());
	});
}

function getAnimationTransforms(model, animation, time) {
	var t =Math.round(time/60);
	var frame = t % model.animations[animation].count;
	//frame = 15;
	//t = 0;

	var transforms = {};
	for (var jointIndex in model.animations[animation]) {
		if(jointIndex !== 'count') {
			var joint = model.animations[animation][jointIndex];
			//
			var countT = joint.translation.length;
			var countR = joint.rotation.length;
			var countS = joint.scale.length;
			//
			var frameT = 0;
			var frameR = 0;
			var frameS = 0;
			if(countT !== 0) frameT = t % countT;
			if(countR !== 0) frameR = t % countR;
			if(countS !== 0) frameS = t % countS;
			//
			//console.log(countT, countR, countS);
			//
			var translation = joint.translation[frameT] !== undefined ? joint.translation[frameT].transform : [0, 0, 0];
			var rotation = joint.rotation[frameR] !== undefined ? joint.rotation[frameR].transform : [0, 0, 0, 1];
			var scale = joint.scale[frameS] !== undefined ? joint.scale[frameS].transform : [1, 1, 1];
			transforms[jointIndex] = m4.compose(translation, rotation, scale);

			/****/
			// var translation = joint.translation[frame] !== undefined ? joint.translation[frame].transform : [0, 0, 0];
			// var rotation = joint.rotation[frame] !== undefined ? joint.rotation[frame].transform : [0, 0, 0, 1];
			// var scale = joint.scale[frame] !== undefined ? joint.scale[frame].transform : [1, 1, 1];
			// transforms[jointIndex] = m4.compose(translation, rotation, scale);
		}
	}
	//
	return transforms;
}
function applyToSkin(model, animationTransforms) {
	var appliedTransforms = [];
	model.skins.forEach(skin => {
			model.rootNodes.forEach(element => {
				applyTransform(model, appliedTransforms, animationTransforms, m4.identity(), skin, element);
			});
	});
	//console.log(appliedTransforms);
	return appliedTransforms;
}
function applyTransform(model, appliedTransforms, animationTransforms, matrix, skin, nodeIndex) {
	var node = model.nodes[nodeIndex];
	var transformIndex = skin.joints.indexOf(nodeIndex);
	//var matrix2 = [];
	//
	//m4.multiply(matrix, node.localBindTransform, matrix);
	//
	if (animationTransforms[nodeIndex] !== undefined) {
			m4.multiply(matrix, animationTransforms[nodeIndex], matrix);
	}
	else {
		//m4.multiply(matrix, m4.identity(), matrix);
		//animationTransforms[nodeIndex] = m4.identity();
		//m4.multiply(matrix, node.localBindTransform, matrix);
	}
	var ibt = skin.inverseBindTransforms[transformIndex];
	if (ibt) {
			appliedTransforms[transformIndex] = m4.identity();
			m4.multiply( matrix, ibt, appliedTransforms[transformIndex]);
			//console.log(transformIndex);
	}
	else {
		//appliedTransforms[transformIndex] = matrix;
	}
//m4.copy(matrix, m4.identity())
	node.children.forEach(childNode => {
			applyTransform(model, appliedTransforms, animationTransforms, m4.copy(matrix, m4.identity()), skin, childNode);
	});
}


function getTextureToSkin(gl, model, animationTransforms) {
	//
	var boneArray = [];
	var numBones = 0;
	model.skins.forEach((skin, i) => {
		numBones = numBones + skin.joints.length;
	});

	applyToSkin(model, animationTransforms).forEach((matrix, i) => {
		boneArray = boneArray.concat(Array.from(matrix));
		//boneArray = boneArray.concat(matrix);
	});
	//console.log(boneArray);
	var boneTypedArray = new Float32Array(boneArray);
	//
	// подготавливаем текстуру для костных матриц
	var boneMatrixTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, boneMatrixTexture);
	// так как мы хотим использовать текстуру для чистых данных, мы поворачиваем
	// отключаем фильтрацию
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	// также отключаем перенос, так как текстура не может быть степенью двойки
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(
    gl.TEXTURE_2D,
    0,         // уровень
    gl.RGBA,   // внутренний формат
    4,         // ширина 4 пикселя, каждый пиксель имеет RGBA, поэтому 4 пикселя — это 16 значений
    numBones,  // по одной строке на кость
    0,         // граница
    gl.RGBA,   // формат
    gl.FLOAT,  // тип
    boneTypedArray);

	return {
		texture: boneMatrixTexture,
		numBones: numBones,
	};
}

function getTextureTransforms(animations) {
	//
}

//............Примитивы.............//
//создать примитив 'cube'
function createCube(engine, modelInfo) {
	var gl = engine.gl;
	//create gltf
	modelInfo.gltf = {
		scene: 0,
		scenes: [ { nodes: [0] } ],
		nodes: [ { mesh: 0 } ],
		meshes: [
			{
				primitives: [
					{
						attributes: {
							NORMAL: 2,
							POSITION: 1,
							TEXCOORD_0: 3,
						},
						indices: 0,
						mode: 4,
						material: 0,
					},
				]
			},
		],
		materials: [
			{
				pbrMetallicRoughness: {
					baseColorTexture: { index: 0, texCoord: 0 },
				},
			},
		],
		textures: [ {sampler: 0, source: 0} ],
		samplers: [
			{
				minFilter: gl.LINEAR_MIPMAP_LINEAR,
				magFilter: gl.NEAREST,
				wrapS: gl.REPEAT,
				wrapT: gl.REPEAT,
			},
		],
		images: [ { uri: modelInfo.material.baseColorTexture } ],
	};
	//create buffers
	var x = modelInfo.geometry[0];
	var y = modelInfo.geometry[1];
	var z = modelInfo.geometry[2];
	modelInfo.buffers = {
		0: {
			componentType: 5123,
			data: new Uint16Array([
				// лицевая часть
				0, 1, 2,
				2, 3, 0,
				// задняя часть
				4, 5, 6,
				6, 7, 4,
				//левая боковая часть
				8, 9, 10,
				10, 11, 8,
				// правая боковая часть
				12, 13, 14,
				14, 15, 12,
				// верхняя часть
				19, 18, 17,
				17, 16, 19,
				// нижняя часть
				23, 22 ,21,
				21, 20 ,23,
			]),
		},
		1: {
			size: accessorSizes['VEC3'],
			componentType: 5126,
			location: attributeType['POSITION'],
			data: new Float32Array([
				// лицевая часть
				-x, -y, z, //0
				-x, y, z, //1
				x, y, z, //2
				x, -y, z, //3
				// задняя часть
				-x, -y, -z, //4
				-x, y, -z, //5
				x, y, -z, //6
				x, -y, -z, //7
				// левая боковая часть
				-x, -y, z, //8
				-x, y, z, //9
				-x, y, -z, //10
				-x, -y, -z, //11
				// правая боковая часть
				x, -y, z, //12
				x, y, z, //13
				x, y, -z, //14
				x, -y, -z, //15
				// верхняя часть
				-x, y, z, //16
				-x, y, -z, //17
				x, y, -z, //18
				x, y, z, //19
				// нижняя часть
				-x, -y, z, //20
				-x, -y, -z, //21
				x, -y, -z, //22
				x, -y, z, //23
			]),
		},
		2: {
			size: accessorSizes['VEC3'],
			componentType: 5126,
			location: attributeType['NORMAL'],
			data: new Float32Array([
				// Лицевая сторона
				0,  0,  1, //0
				0,  0,  1, //1
				0,  0,  1, //2
				0,  0,  1, //3
				// Задняя сторона
				0,  0, -1, //4
				0,  0, -1, //5
				0,  0, -1, //6
				0,  0, -1, //7
				// Левая боковая сторона
				-1,  0,  0, //8
				-1,  0,  0, //9
				-1,  0,  0, //10
				-1,  0,  0, //11
				// Правая боковая сторона
				1,  0,  0, //12
				1,  0,  0, //13
				1,  0,  0, //14
				1,  0,  0, //15
				// верхняя часть
				0,  1,  0, //16
				0,  1,  0, //17
				0,  1,  0, //18
				0,  1,  0, //29
				// нижняя часть
				0,  -1,  0, //20
				0,  -1,  0, //21
				0,  -1,  0, //22
				0,  -1,  0, //23
			]),
		},
		3: {
			size: accessorSizes['VEC2'],
			componentType: 5126,
			location: attributeType['TEXCOORD_0'],
			data: new Float32Array([
				// //1
				0, 0,
				0, 1,
				1, 1,
				1, 0,
				//2
				0, 0,
				0, 1,
				1, 1,
				1, 0,
				//3
				0, 0,
				0, 1,
				1, 1,
				1, 0,
				//4
				0, 0,
				0, 1,
				1, 1,
				1, 0,
				//5
				0, 0,
				0, 1,
				1, 1,
				1, 0,
				//6
				0, 0,
				0, 1,
				1, 1,
				1, 0,
			]),
		},
	};
	modelInfo.url = modelInfo.material.url;
	//create model
	return createGLTF(engine, modelInfo);
}


//
return {
	initGLTF: initGLTF,
	createCube: createCube,
	applyToSkin: applyToSkin,
	getAnimationTransforms: getAnimationTransforms,
	getTextureToSkin: getTextureToSkin,
	setAnimationToNodes: setAnimationToNodes,
}
}));
