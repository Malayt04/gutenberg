import { Page } from '@wordpress/admin-ui';
import { __, _x } from '@wordpress/i18n';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button, __experimentalVStack as VStack } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { DataForm } from '@wordpress/dataviews';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { MediaEdit } from '@wordpress/fields';
import { decodeEntities } from '@wordpress/html-entities';
import { privateApis as mediaEditorPrivateApis } from '@wordpress/media-editor';
import { unlock } from '../../lock-unlock';

const { store: mediaEditorStore, MediaEditorModal } = unlock(
	mediaEditorPrivateApis
);
const { usePostFields } = unlock( editorPrivateApis );

function IdentityMediaEdit( props ) {
	const { openMediaEditorModal } = useDispatch( mediaEditorStore );
	const value = props.field.getValue( { item: props.data } );

	return (
		<VStack spacing={ 3 }>
			<MediaEdit { ...props } />
			{ !! value && (
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ () => {
						openMediaEditorModal( {
							id: value,
							onUpdate: ( { id: newId } ) => {
								props.onChange(
									props.field.setValue( {
										item: props.data,
										value: newId,
									} )
								);
							},
						} );
					} }
					style={ { justifyContent: 'center' } }
				>
					{ __( 'Adjust image' ) }
				</Button>
			) }
		</VStack>
	);
}

const fields = [
	{
		id: 'title',
		type: 'text',
		label: __( 'Site Title' ),
		description: __(
			"Displays in your site's layout via the Site Title block."
		),
		getValue: ( { item } ) => decodeEntities( item.title ?? '' ),
	},
	{
		id: 'description',
		type: 'text',
		label: __( 'Site Tagline' ),
		description: __(
			"In a few words, explain what this site is about. Displays in your site's layout via the Site Tagline block."
		),
		getValue: ( { item } ) => decodeEntities( item.description ?? '' ),
	},
	{
		id: 'site_logo',
		type: 'media',
		label: __( 'Site Logo' ),
		description: __(
			"Displays in your site's layout via the Site Logo block."
		),
		placeholder: __( 'Choose logo' ),
		Edit: IdentityMediaEdit,
		setValue: ( { value } ) => ( {
			site_logo: value ?? 0,
		} ),
	},
	{
		id: 'site_icon',
		type: 'media',
		label: __( 'Site Icon' ),
		description: __(
			'Shown in browser tabs, bookmarks, and mobile apps. It should be square and at least 512 by 512 pixels.'
		),
		placeholder: __( 'Choose icon' ),
		Edit: IdentityMediaEdit,
		setValue: ( { value } ) => ( {
			site_icon: value ?? 0,
		} ),
	},
];

const form = {
	layout: {
		type: 'regular',
		labelPosition: 'top',
	},
	fields: [ 'title', 'description', 'site_logo', 'site_icon' ],
};

export default function SidebarIdentity() {
	const data = useSelect(
		( select ) =>
			select( coreStore ).getEditedEntityRecord( 'root', 'site' ),
		[]
	);
	const { editEntityRecord } = useDispatch( coreStore );
	const attachmentFields = usePostFields( { postType: 'attachment' } );

	const onChange = ( edits ) => {
		editEntityRecord( 'root', 'site', undefined, edits );
	};

	return (
		<Page
			title={ _x( 'Identity', 'site identity' ) }
			headingLevel={ 2 }
			hasPadding
		>
			<DataForm
				data={ data }
				fields={ fields }
				form={ form }
				onChange={ onChange }
			/>
			<MediaEditorModal fields={ attachmentFields } />
		</Page>
	);
}
