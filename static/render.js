{

const D = document
const E = tagName => D.createElement(tagName)

window.Render = Render

const mapAttr = { class: 'className' }

function Render (object) {
	if (typeof object === 'string') return D.createTextNode(object)

	const [tagName, arg] = Object.entries(object)[0]
	const e = E(tagName)
	if (typeof arg === 'object') {
		const { _: children, ...attrs } = Array.isArray(arg) ? { _: arg } : arg
		Object.entries(attrs).forEach(([key, value]) => {
			e[mapAttr[key] || key] = value
		})
		if (children) {
      if (Array.isArray(children))
  			children.forEach(child => e.appendChild(Render(child)))
      else
        e.appendChild(Render(children))
		}
	} else if (typeof arg === 'string') {
		e.appendChild(Render(arg))
	}
	return e
}

}