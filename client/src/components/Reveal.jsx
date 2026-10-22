import { useReveal } from '../lib/hooks'

export default function Reveal({ children, className = '', delay = 0, scale = false, as: Tag = 'div', ...rest }) {
  const [ref, visible] = useReveal()
  return (
    <Tag
      ref={ref}
      className={`${scale ? 'reveal-scale' : 'reveal'} ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...(rest.style || {}) }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
