import React from 'react'
import { Grid, Select, Header, Icon, Label, DropdownItemProps, Image } from 'semantic-ui-react'
import { FileType, SourceType, Source, ResponseRequestWithPagination, DatasetModalUserFileTableControl, GeneralTableControl, Nullable, KySearchParams } from '../../utils/interfaces'
import { UploadButton } from '../common/UploadButton'
import { SemanticICONS } from 'semantic-ui-react/dist/commonjs/generic'
import { UserDatasetsModal } from './user-datasets-modal/UserDatasetsModal'
import { CGDSDatasetsModal } from './cgds-datasets-modal/CGDSDatasetsModal'
import ky from 'ky'
import { DjangoUserFile, DjangoCGDSStudy, DjangoInstitution } from '../../utils/django_interfaces'
import { getDefaultGeneralTableControl } from '../../utils/util_functions'
import { HugeFileAdvice } from './HugeFileAdvice'

declare const urlUserFilesCRUD: string
declare const urlCGDSStudiesCRUD: string
declare const urlUserInstitutions: string

/** Used to check which dataset retrieve in certain situations */
enum DatasetType {
    USER_FILE = 1,
    CGDS = 2
}

/**
 * Request extra params to get the User's Files/Datasets
 */
type GetUserFilesSearchParams = {
    /** Page Number */
    page: number,
    /** Page Size */
    page_size: number,
    /** Search String */
    search?: string,
    /** Field to sort */
    ordering?: string,
    /** FileType (mRNA, miRNA, etc) */
    file_type: FileType
    /** Id of tag */
    tag?: number,
    /** Institution ID for filtering. The name of field is in plural because Django Rest Framework */
    institutions?: 'all' | 'private' | 'public' | number,
    /** If specified, returns only User's private datasets */
    private?: Nullable<string>,
    /** If specified, returns only public datasets */
    public?: Nullable<string>,
    /** If specified, returns only clinical datasets which have at least one survival column tuple */
    with_survival_only?: Nullable<string>,
}

/**
 * Request extra params to get the CGDSStudies
 */
type GetCGDSStudiesSearchParams = {
    /** Page Number */
    page: number,
    /** Page Size */
    page_size: number,
    /** Search String */
    search?: string,
    /** Field to sort */
    ordering?: string,
    /** FileType (mRNA, miRNA, etc) */
    file_type: FileType
}

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
    gettingDatasets: boolean,
    datasets: DjangoUserFile[],
    CGDSStudies: DjangoCGDSStudy[],
    selectedFile: Nullable<DjangoUserFile>,
    selectedStudy: Nullable<DjangoCGDSStudy>,
    tableControlUserDatasets: DatasetModalUserFileTableControl,
    tableControlCGDSStudies: GeneralTableControl,
    userInstitutions: DjangoInstitution[]
}

/**
 * Renders a Dropdown with options for selecting a source dataset for an Experiment,
 * Survival Analysis, etc
 * @param props Component's props
 * @returns Component
 */
class SourceForm extends React.Component<SourceFormProps, SourceFormState> {
    filterTimeout: number | undefined

    constructor (props) {
        super(props)

        this.state = {
            showUserDatasetsModal: false,
            showCGDSDatasetsModal: false,
            gettingDatasets: false,
            datasets: [],
            CGDSStudies: [],
            selectedFile: null,
            selectedStudy: null,
            userInstitutions: [],
            tableControlUserDatasets: {
                ...this.getDefaultTableControl(),
                tagId: null,
                visibility: 'all'
            },
            tableControlCGDSStudies: this.getDefaultTableControl()
        }
    }

    /**
     * Generates a default table control object sorted by name and pageSize = 50
     * @returns Default GeneralTableControl object
     */
    getDefaultTableControl (): GeneralTableControl {
        const defaultTableControl = getDefaultGeneralTableControl()
        return { ...defaultTableControl, sortField: 'name', pageSize: 50 }
    }

    /**
     * Opens the modal for select the User's dataset
     */
    openUsersDatasetsSelectionModal = () => {
        this.getUserDatasets()
        this.getUserInstitutions()
        this.setState({ showUserDatasetsModal: true })
    }

    /**
     * Opens the modal for select the CGDSDataset
     */
    openCGDSDatasetsSelectionModal = () => {
        this.getCGDSStudies()
        this.setState({ showCGDSDatasetsModal: true })
    }

    /**
     * Fetches the Institutions of which the User is part of
     */
    getUserInstitutions () {
        ky.get(urlUserInstitutions).then((response) => {
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
     * Updates the UserFiles  TableControl state
     * @param field Field to update
     * @param value New value for the field
     * @param resetPagination If true, resets pagination to pageNumber = 1. Useful when the filters change
     */
    handleTableControlUserFiles = (field: string, value, resetPagination: boolean = true) => {
        const tableControlUserDatasets = this.state.tableControlUserDatasets

        tableControlUserDatasets[field] = value

        // If pagination reset is required...
        if (resetPagination) {
            tableControlUserDatasets.pageNumber = 1
        }

        this.setState<never>({ tableControlUserDatasets }, () => {
            clearTimeout(this.filterTimeout)
            this.filterTimeout = window.setTimeout((this.getUserDatasets), 300)
        })
    }

    /**
     * Updates the CGDSStudies TableControl state
     * @param field Field to update
     * @param value New value for the field
     * @param resetPagination If true, resets pagination to pageNumber = 1. Useful when the filters change
     */
    handleTableControlCGDSStudies = (field: string, value, resetPagination: boolean = true) => {
        const tableControlCGDSStudies = this.state.tableControlCGDSStudies

        tableControlCGDSStudies[field] = value

        // If pagination reset is required...
        if (resetPagination) {
            tableControlCGDSStudies.pageNumber = 1
        }

        this.setState<never>({ tableControlCGDSStudies }, () => {
            clearTimeout(this.filterTimeout)
            this.filterTimeout = window.setTimeout((this.getCGDSStudies), 300)
        })
    }

    /**
     * Handles sorting on table (UsersFiles or CGDSStudies)
     * @param headerServerCodeToSort Server code of the selected column to send to the server for sorting
     * @param datasetType Dataset to check which state change and which dataset retrieve after sorting
     */
    handleSort = (headerServerCodeToSort: string, datasetType: DatasetType) => {
        const tableControlName = datasetType === DatasetType.USER_FILE
            ? 'tableControlUserDatasets'
            : 'tableControlCGDSStudies'

        const tableControl = this.state[tableControlName]

        // If the user has selected other column for sorting...
        if (tableControl.sortField !== headerServerCodeToSort) {
            tableControl.sortField = headerServerCodeToSort
            tableControl.sortOrderAscendant = true
        } else {
            // If it's the same just change the sort order
            tableControl.sortOrderAscendant = !tableControl.sortOrderAscendant
        }
        this.setState<never>({ [tableControlName]: tableControl }, () => {
            if (datasetType === DatasetType.USER_FILE) {
                this.getUserDatasets()
            } else {
                this.getCGDSStudies()
            }
        })
    }

    /**
     * Fetches the logged user files to submit a pipeline
     */
    getUserDatasets = () => {
        const tableControl = this.state.tableControlUserDatasets

        const searchParams: GetUserFilesSearchParams = {
            file_type: this.props.fileType,
            search: tableControl.textFilter,
            page: tableControl.pageNumber,
            page_size: tableControl.pageSize
        }

        if (tableControl.sortField) {
            searchParams.ordering = `${tableControl.sortOrderAscendant ? '' : '-'}${tableControl.sortField}`
        }

        if (tableControl.tagId) {
            searchParams.tag = tableControl.tagId
        }

        if (this.props.showOnlyClinicalDataWithSurvivalTuples) {
            searchParams.with_survival_only = null
        }

        // NOTE: for 'private' and 'public' conditions the backend just need to check if the key is present in query params
        // If an empty string is set Ky doesn't send the param, that's why it's setting the keys as null here
        if (tableControl.visibility === 'private') {
            searchParams.private = null
        } else {
            if (tableControl.visibility === 'public') {
                searchParams.public = null
            } else {
                if (tableControl.visibility !== 'all') {
                    searchParams.institutions = tableControl.visibility
                }
            }
        }

        this.setState({ gettingDatasets: true }, () => {
            ky.get(urlUserFilesCRUD, { searchParams: searchParams as KySearchParams }).then((response) => {
                this.setState({ gettingDatasets: false })

                response.json().then((paginatedResponse: ResponseRequestWithPagination<DjangoUserFile>) => {
                    const tableControlUserDatasets = this.state.tableControlUserDatasets
                    tableControlUserDatasets.totalRowCount = paginatedResponse.count
                    this.setState({
                        datasets: paginatedResponse.results,
                        tableControlUserDatasets
                    })
                }).catch((err) => {
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                this.setState({ gettingDatasets: false })
                console.log('Error getting user datasets', err)
            })
        })
    }

    /**
     * Fetches the CGDS studies to submit a pipeline
     */
    getCGDSStudies = () => {
        const tableControl = this.state.tableControlCGDSStudies

        const searchParams: GetCGDSStudiesSearchParams = {
            file_type: this.props.fileType,
            search: tableControl.textFilter,
            page: tableControl.pageNumber,
            page_size: tableControl.pageSize
        }

        if (tableControl.sortField) {
            searchParams.ordering = `${tableControl.sortOrderAscendant ? '' : '-'}${tableControl.sortField}`
        }

        this.setState({ gettingDatasets: true }, () => {
            ky.get(urlCGDSStudiesCRUD, { searchParams: searchParams as KySearchParams }).then((response) => {
                this.setState({ gettingDatasets: false })

                response.json().then((paginatedResponse: ResponseRequestWithPagination<DjangoCGDSStudy>) => {
                    const tableControlCGDSStudies = this.state.tableControlCGDSStudies
                    tableControlCGDSStudies.totalRowCount = paginatedResponse.count
                    this.setState({
                        CGDSStudies: paginatedResponse.results,
                        tableControlCGDSStudies
                    })
                }).catch((err) => {
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                this.setState({ gettingDatasets: false })
                console.log('Error getting user datasets', err)
            })
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
            selectedStudy: null,
            datasets: []
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
                        onClick={this.openUsersDatasetsSelectionModal}>
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
                        onClick={this.openCGDSDatasetsSelectionModal}>
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
                    datasets={this.state.datasets}
                    tableControl={this.state.tableControlUserDatasets}
                    showUserDatasetsModal={this.state.showUserDatasetsModal}
                    selectedFile={this.state.selectedFile}
                    selectingFileType={this.props.fileType}
                    tagOptions={this.props.tagOptions}
                    institutionsOptions={institutionsOptions}
                    selectFile={this.selectUploadedFile}
                    handleClose={this.handleClose}
                    markFileAsSelected={this.markFileAsSelected}
                    handleTableControlChanges={this.handleTableControlUserFiles}
                    handleSort={this.handleSort}
                />

                {/* Select CGDS Study modal */}
                {showCBioPortalOption &&
                    <CGDSDatasetsModal
                        studies={this.state.CGDSStudies}
                        showCGDSDatasetsModal={this.state.showCGDSDatasetsModal}
                        gettingDatasets={this.state.gettingDatasets}
                        selectedStudy={this.state.selectedStudy}
                        tableControl={this.state.tableControlCGDSStudies}
                        selectStudy={this.selectStudy}
                        handleClose={this.handleClose}
                        markStudyAsSelected={this.markStudyAsSelected}
                        handleTableControlChanges={this.handleTableControlCGDSStudies}
                        handleSort={this.handleSort}
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

export { SourceForm, DatasetType }
