import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform, type Texture } from 'three'

const fragmentShader = /* glsl */ `
uniform float edgeStrength;
uniform float depthThreshold;
uniform vec3 edgeColor;
uniform sampler2D normalBuffer;
uniform float normalThreshold;
uniform float normalEdgeStrength;
uniform float lineThickness;

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  vec2 texelSize = 1.0 / resolution;
  vec2 step1 = texelSize * lineThickness;

  // 采样 3x3 邻域深度（第一轮，按 lineThickness 缩放）
  float d00 = readDepth(uv + vec2(-step1.x, -step1.y));
  float d10 = readDepth(uv + vec2(0.0, -step1.y));
  float d20 = readDepth(uv + vec2(step1.x, -step1.y));
  float d01 = readDepth(uv + vec2(-step1.x, 0.0));
  float d21 = readDepth(uv + vec2(step1.x, 0.0));
  float d02 = readDepth(uv + vec2(-step1.x, step1.y));
  float d12 = readDepth(uv + vec2(0.0, step1.y));
  float d22 = readDepth(uv + vec2(step1.x, step1.y));

  // Sobel 深度边缘检测
  float sobelX = d00 + 2.0 * d01 + d02 - d20 - 2.0 * d21 - d22;
  float sobelY = d00 + 2.0 * d10 + d20 - d02 - 2.0 * d12 - d22;
  float depthEdge = sqrt(sobelX * sobelX + sobelY * sobelY);

  // 第二轮 Sobel：2x 采样距离，模拟更粗线宽
  vec2 step2 = step1 * 2.0;
  float e00 = readDepth(uv + vec2(-step2.x, -step2.y));
  float e10 = readDepth(uv + vec2(0.0, -step2.y));
  float e20 = readDepth(uv + vec2(step2.x, -step2.y));
  float e01 = readDepth(uv + vec2(-step2.x, 0.0));
  float e21 = readDepth(uv + vec2(step2.x, 0.0));
  float e02 = readDepth(uv + vec2(-step2.x, step2.y));
  float e12 = readDepth(uv + vec2(0.0, step2.y));
  float e22 = readDepth(uv + vec2(step2.x, step2.y));

  float sobelX2 = e00 + 2.0 * e01 + e02 - e20 - 2.0 * e21 - e22;
  float sobelY2 = e00 + 2.0 * e10 + e20 - e02 - 2.0 * e12 - e22;
  float depthEdge2 = sqrt(sobelX2 * sobelX2 + sobelY2 * sobelY2);

  depthEdge = max(depthEdge, depthEdge2);
  float depthLine = smoothstep(depthThreshold, depthThreshold * 2.0, depthEdge) * edgeStrength;

  // 采样 3x3 邻域法线（使用 lineThickness 缩放）
  vec3 n00 = texture2D(normalBuffer, uv + vec2(-step1.x, -step1.y)).rgb;
  vec3 n10 = texture2D(normalBuffer, uv + vec2(0.0, -step1.y)).rgb;
  vec3 n20 = texture2D(normalBuffer, uv + vec2(step1.x, -step1.y)).rgb;
  vec3 n01 = texture2D(normalBuffer, uv + vec2(-step1.x, 0.0)).rgb;
  vec3 n21 = texture2D(normalBuffer, uv + vec2(step1.x, 0.0)).rgb;
  vec3 n02 = texture2D(normalBuffer, uv + vec2(-step1.x, step1.y)).rgb;
  vec3 n12 = texture2D(normalBuffer, uv + vec2(0.0, step1.y)).rgb;
  vec3 n22 = texture2D(normalBuffer, uv + vec2(step1.x, step1.y)).rgb;

  // Sobel 法线边缘检测
  vec3 nSobelX = n00 + 2.0 * n01 + n02 - n20 - 2.0 * n21 - n22;
  vec3 nSobelY = n00 + 2.0 * n10 + n20 - n02 - 2.0 * n12 - n22;
  float normalEdge = length(nSobelX) + length(nSobelY);
  float normalLine = smoothstep(normalThreshold, normalThreshold * 2.0, normalEdge) * normalEdgeStrength;

  float edge = max(depthLine, normalLine);
  outputColor = vec4(mix(inputColor.rgb, edgeColor, edge), inputColor.a);
}
`

export class ToonEdgeEffect extends Effect {
  constructor({
    edgeStrength = 0.85,
    depthThreshold = 0.0008,
    edgeColor = [0.22, 0.16, 0.12] as [number, number, number],
    normalBuffer = null as Texture | null,
    normalThreshold = 0.3,
    normalEdgeStrength = 0.5,
    lineThickness = 1.0,
  }: {
    edgeStrength?: number
    depthThreshold?: number
    edgeColor?: [number, number, number]
    normalBuffer?: Texture | null
    normalThreshold?: number
    normalEdgeStrength?: number
    lineThickness?: number
  } = {}) {
    super('ToonEdgeEffect', fragmentShader, {
      attributes: EffectAttribute.DEPTH,
      uniforms: new Map<string, Uniform>([
        ['edgeStrength', new Uniform(edgeStrength)],
        ['depthThreshold', new Uniform(depthThreshold)],
        ['edgeColor', new Uniform(edgeColor)],
        ['normalBuffer', new Uniform(normalBuffer)],
        ['normalThreshold', new Uniform(normalThreshold)],
        ['normalEdgeStrength', new Uniform(normalEdgeStrength)],
        ['lineThickness', new Uniform(lineThickness)],
      ]),
    })
  }
}
