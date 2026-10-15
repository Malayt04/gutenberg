import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyzeAudioFile, encodeAudioWaveform } from '../audio-waveform';

afterEach( () => vi.unstubAllGlobals() );

describe( 'encodeAudioWaveform', () => {
	it( 'preserves silence and loud sections in 512 unsigned peaks', () => {
		const samples = new Float32Array( 1024 );
		samples.fill( 1, 512 );
		const waveform = encodeAudioWaveform( {
			length: samples.length,
			numberOfChannels: 1,
			getChannelData: () => samples,
		} );

		expect( waveform?.peak_count ).toBe( 512 );
		expect( waveform?.peaks ).toHaveLength( 684 );
		const bytes = Buffer.from( waveform?.peaks || '', 'base64' );
		expect( bytes ).toHaveLength( 512 );
		expect( [ ...bytes.subarray( 0, 256 ) ] ).toEqual(
			Array( 256 ).fill( 0 )
		);
		expect( [ ...bytes.subarray( 256 ) ] ).toEqual(
			Array( 256 ).fill( 255 )
		);
	} );

	it( 'analyses local file bytes through an 8 kHz audio context', async () => {
		const samples = new Float32Array( 512 ).fill( 0.5 );
		const decodeAudioData = vi.fn().mockResolvedValue( {
			length: samples.length,
			numberOfChannels: 1,
			getChannelData: () => samples,
		} );
		const context = vi.fn( function AudioContext() {
			return { decodeAudioData };
		} );
		vi.stubGlobal( 'OfflineAudioContext', context );

		const waveform = await analyzeAudioFile( {
			size: 11,
			arrayBuffer: vi.fn().mockResolvedValue( new ArrayBuffer( 11 ) ),
		} as unknown as File );

		expect( context ).toHaveBeenCalledWith( 1, 1, 8000 );
		expect( decodeAudioData ).toHaveBeenCalledOnce();
		expect( waveform?.peak_count ).toBe( 512 );
	} );

	it( 'lets an unsupported audio file continue without waveform metadata', async () => {
		vi.stubGlobal( 'OfflineAudioContext', undefined );
		const waveform = await analyzeAudioFile(
			new File( [ 'audio' ], 'song.mp3', { type: 'audio/mpeg' } )
		);

		expect( waveform ).toBeUndefined();
	} );
} );
