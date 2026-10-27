/** 压缩图片为 JPEG Data URL，便于直接入库回显 */
export function compressImageToDataUrl(
  file: File,
  options: { maxEdge?: number; quality?: number; maxBytes?: number } = {},
): Promise<string> {
  const maxEdge = options.maxEdge ?? 400
  const quality = options.quality ?? 0.82
  const maxBytes = options.maxBytes ?? 180_000

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = Math.min(1, maxEdge / Math.max(image.width, image.height))
      const width = Math.max(1, Math.round(image.width * scale))
      const height = Math.max(1, Math.round(image.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('浏览器不支持图片压缩'))
        return
      }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(image, 0, 0, width, height)

      let q = quality
      let dataUrl = canvas.toDataURL('image/jpeg', q)
      while (dataUrl.length > maxBytes && q > 0.45) {
        q -= 0.08
        dataUrl = canvas.toDataURL('image/jpeg', q)
      }
      if (dataUrl.length > maxBytes) {
        reject(new Error('图片过大，请换一张更小的图片'))
        return
      }
      resolve(dataUrl)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('无法读取图片'))
    }
    image.src = objectUrl
  })
}
