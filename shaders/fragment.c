@binding(1) @group(0) var Sampler : sampler;
      @binding(2) @group(0) var textureData : texture_2d<f32>;
      @stage(fragment)
      fn main(@location(0) vUV: vec2<f32>) -> @location(0) vec4<f32> {
      let textureColor:vec3<f32> = (textureSample(textureData, Sampler, vUV)).rgb;
      return vec4<f32>(textureColor, 1.0);
    }
