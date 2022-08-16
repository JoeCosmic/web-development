struct Uniform {
       mMatrix : mat4x4<f32>,
       pMatrix : mat4x4<f32>,
       vMatrix : mat4x4<f32>,
      };
      @binding(0) @group(0) var<uniform> uniforms : Uniform;

      struct Output {
          @builtin(position) Position : vec4<f32>,
          @location(0) vUV : vec2<f32>,
      };
      @stage(vertex)
        fn main(@location(0) pos: vec4<f32>, @location(1) uv: vec2<f32>) -> Output {

            var output: Output;
            output.Position = uniforms.pMatrix * uniforms.vMatrix * uniforms.mMatrix * pos;
            output.vUV = uv;
            return output;
        }
