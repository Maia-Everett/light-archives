import sanitizeHtml from 'sanitize-html';

const html = {
	sanitize(input: string): string {
		return sanitizeHtml(input, {
			allowedTags: [ ...sanitizeHtml.defaults.allowedTags, 'img' ],
			allowedClasses: {
				'section': [ 'hide-details' ],
				'div': [ 'hide-details__title', 'hide-details__content' ],
			},
			allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes,
				'*': [ 'style' ],
				'table': [ 'border', 'cellpadding', 'cellspacing' ],
				'img': [ 'src', 'alt', 'title', 'width', 'height' ],
			},
		});
	}
};

export default html;
