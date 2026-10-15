import { describe, expect, it } from 'vitest';
import { decodeWaveform } from '../waveform-data';

describe( 'decodeWaveform', () => {
	it( 'converts encoded amplitude bytes into player peaks', () => {
		const waveform = btoa(
			String.fromCharCode( ...Array( 512 ).fill( 255 ) )
		);

		expect( decodeWaveform( waveform ) ).toEqual( Array( 512 ).fill( 1 ) );
	} );

	it( 'rejects malformed and short waveform data', () => {
		expect( decodeWaveform( 'AAAA' ) ).toBeUndefined();
		expect( decodeWaveform( {} ) ).toBeUndefined();
	} );
} );
