import React from 'react'
import { Grid, Select, Header, Icon, Label, DropdownItemProps, Image } from 'semantic-ui-react'
import { FileType, SourceType, Source, Nullable } from '../../utils/interfaces'
import { UploadButton } from '../common/UploadButton'
import { SemanticICONS } from 'semantic-ui-react/dist/commonjs/generic'
import { UserDatasetsModal } from './user-datasets-modal/UserDatasetsModal'
import { CGDSDatasetsModal } from './cgds-datasets-modal/CGDSDatasetsModal'
import ky from 'ky'
import { DjangoUserFile, DjangoCGDSStudy, DjangoInstitution } from '../../utils/django_interfaces'
import { HugeFileAdvice } from './HugeFileAdvice'

declare const urlUserInstitutions: string

/** Header icon/image */
type HeaderIcon = {
    type: 'icon' | 'img'
    src: SemanticICONS | string
}

/**
 * Component's props
 */
interface SourceFormProps {
    /** Source object to handle the form */
    source: Source,
    /** Title of the header */
    headerTitle: string,
    /** Icon of the header */
    headerIcon: HeaderIcon,
    /** Select 'disable' prop */
    disabled?: boolean,
    /** Type of the file to be selected as source (mRNA, miRNA, CNA, etc) */
    fileType: FileType,
    /** List of Tags to filter */
    tagOptions: DropdownItemProps[],
    /** If false it doesn't show the option to select a cBioPortal study (true by default) */
    showCBioPortalOption?: boolean,
    /** Flag to retrieve only clinical datasets with at least one survival tuple (if the file type is other than clinical, this parameter is ignores). By default false */
    showOnlyClinicalDataWithSurvivalTuples?: boolean,
    /** Function callback to handle changes in source select types */
    handleChangeSourceType: (selectedSourceType: SourceType) => void,
    /** Function callback when a new file is selected from OS browser window */
    selectNewFile: (e: Event) => void,
    /** Function callback when a file is selected from Dataset Modal */
    selectUploadedFile: (selectedFile: DjangoUserFile) => void,
    /** Function callback when a study is selected from CGDS Modal */
    selectStudy: (selectedStudy: DjangoCGDSStudy) => void
}

/**
 * Component's state
 */
interface SourceFormState {
    showUserDatasetsModal: boolean,
    showCGDSDatasetsModal: boolean,
    selectedFile: Nullable<DjangoUserFile>,
    selectedStudy: Nullable<DjangoCGDSStudy>,
    userInstitutions: DjangoInstitution[]
}

/**
 * Renders a Dropdown with options for selecting a source dataset for an Experiment,
 * Survival Analysis, etc
 * @param props Component's props
 * @returns Component
 */
class SourceForm extends React.Component<SourceFormProps, SourceFormState> {
    abortController = new AbortController()

    constructor (props) {
        super(props)

        this.state = {
            showUserDatasetsModal: false,
            showCGDSDatasetsModal: false,
            selectedFile: null,
            selectedStudy: null,
            userInstitutions: []
        }
    }

    /**
     * Abort controller if component unmount
     */
    componentWillUnmount () {
        this.abortController.abort()
    }

    /**
     * Opens the modal for select the User's dataset
     */
    openUsersDatasetsSelectionModal = () => {
        this.getUserInstitutions()
        this.setState({ showUserDatasetsModal: true })
    }

    /**
     * Opens the modal for select the CGDSDataset
     */
    openCGDSDatasetsSelectionModal = () => {
        this.setState({ showCGDSDatasetsModal: true })
    }

    /**
     * Fetches the Institutions of which the User is part of
     */
    getUserInstitutions () {
        ky.get(urlUserInstitutions, { signal: this.abortController.signal }).then((response) => {
            response.json().then((userInstitutions: DjangoInstitution[]) => {
                this.setState({ userInstitutions })
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log("Error getting user's tags ->", err)
        })
    }

    /**
     * Closes the modal for select the dataset and cleans the files list
     */
    handleClose = () => {
        this.setState({
            showUserDatasetsModal: false,
            showCGDSDatasetsModal: false,
            selectedFile: null,
            selectedStudy: null
        })
    }

    /**
     * Render a component to show which file is selected
     * @returns Button or label depending with source the user is using
     */
    getDisplayInfoForSource () {
        const sourceFilename = this.props.source.filename
        let component
        switch (this.props.source.type) {
            case SourceType.NEW_DATASET: {
                const current = this.props.source.newUploadedFileRef.current
                component = (
                    <React.Fragment>
                        <UploadButton
                            color={current && current.files.length > 0 ? 'green' : 'blue'}
                            content={sourceFilename}
                            title={sourceFilename}
                            inputRef={this.props.source.newUploadedFileRef}
                            fileChangeEvent={this.props.selectNewFile}
                        />

                        <Label className="margin-top-2" color="yellow">
                            The file will be added to "Datasets/Multiomix"
                        </Label>

                        {current && current.files.length > 0 &&
                            <HugeFileAdvice fileSize={current.files[0].size} />
                        }
                    </React.Fragment>
                )
                break
            }
            case SourceType.UPLOADED_DATASETS:
                component = (
                    <Label
                        className="clickable full-width"
                        title="Select your dataset"
                        color={this.props.source.selectedExistingFile !== null ? 'green' : 'red'}
                        onClick={this.openUsersDatasetsSelectionModal}
                    >
                        {sourceFilename}
                    </Label>
                )
                break
            case SourceType.CGDS:
                component = (
                    <Label
                        className="clickable full-width"
                        title="Select your dataset"
                        color={this.props.source.CGDSStudy !== null ? 'green' : 'red'}
                        onClick={this.openCGDSDatasetsSelectionModal}
                    >
                        {sourceFilename}
                    </Label>
                )
                break
            default:
                component = null
                break
        }
        return component
    }

    /**
     * Change the source state to submit a pipeline
     * @param selectedSourceType New selected Source
     */
    selectSourceType (selectedSourceType) {
        // Shows the modal if correspond
        if (selectedSourceType === SourceType.UPLOADED_DATASETS) {
            this.openUsersDatasetsSelectionModal()
        } else {
            if (selectedSourceType === SourceType.CGDS) {
                this.openCGDSDatasetsSelectionModal()
            }
        }

        this.props.handleChangeSourceType(selectedSourceType)
    }

    /**
     * Callback when a previously uploaded file is selected as dataset
     * @param selectedFile Selected file
     */
    selectUploadedFile = (selectedFile) => {
        this.props.selectUploadedFile(selectedFile)
        this.handleClose()
    }

    /**
     * Callback when a CGDS Study is selected as dataset
     * @param selectedStudy Selected CGDSStudy
     */
    selectStudy = (selectedStudy) => {
        this.props.selectStudy(selectedStudy)
        this.handleClose()
    }

    /**
     * Callback to mark a File as selected
     * @param selectedFile Selected file to mark
     */
    markFileAsSelected = (selectedFile: DjangoUserFile) => { this.setState({ selectedFile }) }

    /**
     * Callback to mark a CGDSStudy as selected
     * @param selectedStudy Selected CGDSStudy to mark
     */
    markStudyAsSelected = (selectedStudy: DjangoCGDSStudy) => { this.setState({ selectedStudy }) }

    render () {
        let institutionsOptions: DropdownItemProps[] = [
            { key: 'all', value: 'all', text: 'All' },
            { key: 'private', value: 'private', text: 'Private' },
            { key: 'public', value: 'public', text: 'Public' }
        ]

        const institutionsOptionsAux: DropdownItemProps[] = this.state.userInstitutions.map((institution) => {
            return { key: institution.id, value: institution.id, text: institution.name }
        })

        institutionsOptions = institutionsOptions.concat(institutionsOptionsAux)

        const showCBioPortalOption = this.props.showCBioPortalOption ?? true

        const selectOptions: DropdownItemProps[] = [
            { key: 'select_source', text: 'Select dataset...', value: SourceType.NONE },
            { key: 'datasets', text: 'From your datasets', value: SourceType.UPLOADED_DATASETS }
        ]

        if (showCBioPortalOption) {
            selectOptions.push({ key: 'cgds', text: 'From cBioPortal', value: SourceType.CGDS })
        }

        selectOptions.push({ key: 'add_new', text: 'Upload dataset', value: SourceType.NEW_DATASET })

        const isIcon = this.props.headerIcon.type === 'icon'
        const icon = isIcon
            ? <Icon name={this.props.headerIcon.src as SemanticICONS} />
            : <Image circular src={this.props.headerIcon.src} />

        return (
            <Grid.Row>
                {/* Select User's files modal */}
                <UserDatasetsModal
                    showUserDatasetsModal={this.state.showUserDatasetsModal}
                    selectedFile={this.state.selectedFile}
                    selectingFileType={this.props.fileType}
                    tagOptions={this.props.tagOptions}
                    institutionsOptions={institutionsOptions}
                    showOnlyClinicalDataWithSurvivalTuples={this.props.showOnlyClinicalDataWithSurvivalTuples ?? false}
                    selectFile={this.selectUploadedFile}
                    handleClose={this.handleClose}
                    markFileAsSelected={this.markFileAsSelected}
                />

                {/* Select CGDS Study modal */}
                {showCBioPortalOption &&
                    <CGDSDatasetsModal
                        showCGDSDatasetsModal={this.state.showCGDSDatasetsModal}
                        selectingFileType={this.props.fileType}
                        selectedStudy={this.state.selectedStudy}
                        selectStudy={this.selectStudy}
                        handleClose={this.handleClose}
                        markStudyAsSelected={this.markStudyAsSelected}
                    />
                }
                <Header as='h4' icon={isIcon} image={!isIcon} textAlign="center">
                    {icon}
                    {this.props.headerTitle}
                </Header>

                <div className='full-width'>
                    {/* Source selection */}
                    <Select
                        button
                        selectOnBlur={false}
                        fluid
                        floating
                        disabled={this.props.disabled}
                        className="margin-bottom-2"
                        value={this.props.source.type as SourceType}
                        options={selectOptions}
                        placeholder='Select dataset...'
                        onChange={(_e, { value }) => this.selectSourceType(value)}
                    />

                    {/* The upload button, if user's datasets is selected */}
                    {this.getDisplayInfoForSource()}
                </div>
            </Grid.Row>
        )
    }
}

export { SourceForm }
