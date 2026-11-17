# Adding skins

Skin manifests are deferred until the specified versioned format can be implemented faithfully. No substitute manifest schema or invented official skin is shipped in M1.

Artwork belongs to `CardPrinting.art`, not gameplay definitions. Its `imageKey` is a lowercase basename ending in `.png`, `.jpg`, `.jpeg`, `.webp`, or `.avif`; paths, traversal, and URLs are rejected. `imageUrl`, when supplied with verified provenance, must use HTTPS. Never change gameplay to support a skin.

Keep unknown artwork absent. Do not copy unavailable official images or fabricate image keys to satisfy count targets. The UI can use the configured official CDN resolver when an actual image key has been verified.
