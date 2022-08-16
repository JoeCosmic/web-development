struct Uniform {
       mMatrix : mat4x4<f32>,
       pMatrix : mat4x4<f32>,
       vMatrix : mat4x4<f32>,
      };
@binding(0) @group(0) var<uniform> uniforms : Uniform;

struct VertexOut {
    @builtin(position) position : vec4<f32>,
    @location(0) vUV : vec2<f32>,
};
@vertex
fn vertex_main(@location(0) position: vec4<f32>, //location(0) - pipeline
            @location(1) uv: vec2<f32> //location(1) - pipeline
          ) -> VertexOut
{
    var output : VertexOut;
    output.position = uniforms.pMatrix * uniforms.vMatrix * uniforms.mMatrix * position;
    output.vUV = uv;
    return output;
}

@group(0) @binding(1) var Sampler : sampler;
@group(0) @binding(2) var textureData : texture_2d<f32>;
@fragment



fn fragment_main(fragData: VertexOut) -> @location(0) vec4<f32>
{
    let textureColor:vec3<f32> = (textureSample(textureData, Sampler, fragData.vUV)).rgb;
    //let textureColor:vec3<f32> = vec3<f32>(0.2,0.5,0.7);
    return vec4<f32>(textureColor, 1.0);
}
