import { useEffect, useState, type ImgHTMLAttributes } from 'react'
import { resolveImageUrl } from '../lib/imageStorage'

export function useStoredImage(source?: string) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    let active = true
    setUrl(source?.startsWith('storage://') ? undefined : source)
    resolveImageUrl(source).then((resolved) => { if (active) setUrl(resolved) }).catch(() => { if (active) setUrl(undefined) })
    return () => { active = false }
  }, [source])
  return url
}

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string
}

export function StoredImage({ src, alt = '', ...props }: Props) {
  const url = useStoredImage(src)
  return <img src={url} alt={alt} {...props} />
}
