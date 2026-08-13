'use client'

// Audit finding: the Tour Catalog admin uploader was sending whatever raw
// file the admin picked straight to Supabase Storage -- a 6000x4000px,
// 8MB phone photo would be served at full size to every visitor. This
// resizes to a sane max dimension and re-encodes as JPEG client-side
// before upload. Non-image files pass through untouched.
export function compressImage(file: File, maxDimension = 1920, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return Promise.resolve(file)
  }

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
      const width = Math.round(img.width * scale)
      const height = Math.round(img.height * scale)

      // Already small enough and not worth re-encoding -- keep the original.
      if (scale >= 1 && file.size < 800 * 1024) {
        resolve(file)
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          const newName = file.name.replace(/\.\w+$/, '') + '.jpg'
          resolve(new File([blob], newName, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}
