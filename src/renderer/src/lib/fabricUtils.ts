import type { Canvas as FabricCanvas, Object as FabricObject } from 'fabric'

export interface SerializedFabricObject {
  id: string
  type: string
  [key: string]: unknown
}

export function serializeFabricObject(obj: FabricObject): string {
  const json = obj.toObject(['id', 'annotationType'])
  return JSON.stringify(json)
}

export function getBoundingBoxNormalized(
  obj: FabricObject,
  canvas: FabricCanvas
): { normX: number; normY: number; normWidth: number; normHeight: number } {
  const bounds = obj.getBoundingRect()
  return {
    normX: bounds.left / canvas.width!,
    normY: bounds.top / canvas.height!,
    normWidth: bounds.width / canvas.width!,
    normHeight: bounds.height / canvas.height!
  }
}
