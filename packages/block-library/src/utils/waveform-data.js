/**
 * Convert a stored 512-byte waveform to the player's 0..1 peak format.
 * Malformed attachment and block values are ignored at the input boundary.
 *
 * @param {unknown} waveform Encoded peak bytes.
 * @return {number[]|undefined} Player peaks when the input is valid.
 */
export function decodeWaveform( waveform ) {
	if ( typeof waveform !== 'string' || waveform.length !== 684 ) {
		return undefined;
	}

	try {
		const bytes = atob( waveform );
		if ( bytes.length !== 512 || btoa( bytes ) !== waveform ) {
			return undefined;
		}
		return Array.from( bytes, ( value ) => value.charCodeAt( 0 ) / 255 );
	} catch {
		return undefined;
	}
}
