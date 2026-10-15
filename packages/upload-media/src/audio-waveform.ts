export const AUDIO_WAVEFORM_PEAK_COUNT = 512;

const AUDIO_WAVEFORM_SAMPLE_RATE = 8000;
const MAX_AUDIO_ANALYSIS_BYTES = 50 * 1024 * 1024;

export interface AudioWaveform {
	peaks: string;
	peak_count: number;
}

type AudioSamples = Pick<
	AudioBuffer,
	'length' | 'numberOfChannels' | 'getChannelData'
>;

/**
 * Reduce decoded audio to a fixed, reusable envelope. Each byte is the
 * maximum absolute amplitude within one equal-duration part of the file.
 *
 * @param buffer Decoded audio samples.
 * @return Encoded waveform, or undefined for empty audio.
 */
export function encodeAudioWaveform(
	buffer: AudioSamples
): AudioWaveform | undefined {
	if ( buffer.length === 0 || buffer.numberOfChannels === 0 ) {
		return undefined;
	}

	const channels = Array.from(
		{ length: buffer.numberOfChannels },
		( _, i ) => buffer.getChannelData( i )
	);
	const peaks = new Uint8Array( AUDIO_WAVEFORM_PEAK_COUNT );
	for ( let index = 0; index < peaks.length; index++ ) {
		const start = Math.floor( ( index * buffer.length ) / peaks.length );
		const end = Math.max(
			start + 1,
			Math.floor( ( ( index + 1 ) * buffer.length ) / peaks.length )
		);
		let amplitude = 0;
		for ( let sample = start; sample < end; sample++ ) {
			for ( const channel of channels ) {
				amplitude = Math.max(
					amplitude,
					Math.abs( channel[ sample ] )
				);
			}
		}
		peaks[ index ] = Math.round( Math.min( amplitude, 1 ) * 255 );
	}

	return {
		peaks: btoa( String.fromCharCode( ...peaks ) ),
		peak_count: AUDIO_WAVEFORM_PEAK_COUNT,
	};
}

/**
 * Decode the local upload before it can be moved to a host without CORS.
 * A failed analysis must never prevent the original file from uploading.
 *
 * @param file   Local audio file.
 * @param signal Upload cancellation signal.
 * @return Encoded waveform when the browser can safely decode the file.
 */
export async function analyzeAudioFile(
	file: File,
	signal?: AbortSignal
): Promise< AudioWaveform | undefined > {
	if (
		file.size === 0 ||
		file.size > MAX_AUDIO_ANALYSIS_BYTES ||
		signal?.aborted ||
		typeof OfflineAudioContext === 'undefined'
	) {
		return undefined;
	}

	try {
		const context = new OfflineAudioContext(
			1,
			1,
			AUDIO_WAVEFORM_SAMPLE_RATE
		);
		const buffer = await context.decodeAudioData(
			await file.arrayBuffer()
		);
		return signal?.aborted ? undefined : encodeAudioWaveform( buffer );
	} catch {
		// Unsupported codecs and corrupt audio still take the ordinary upload path.
		return undefined;
	}
}
