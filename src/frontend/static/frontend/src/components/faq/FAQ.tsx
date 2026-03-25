import React from 'react'
import { Container, Divider, Grid, Header, List } from 'semantic-ui-react'
import { Base } from '../Base'
import { FAQQuestionAndAnswer } from './FAQQuestionAndAnswer'

/**
 * FAQ Page (Frequently Asked Questions).
 *
 * Uses the  `FAQQuestionAndAnswer`  component to display each questions and answers.
 */

export const FAQ = () => {
    return (
        <Base activeItem='faq' wrapperClass='wrapper'>
            <Container text className='margin-top-2 margin-bottom-5'>
                <Grid stackable>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Header as='h1'>Frequently Asked Questions</Header>
                            <Divider />

                            {/* Question 1: What is Multiomix? */}
                            <FAQQuestionAndAnswer
                                segmentId='what-is-multiomix'
                                headerTitle='What is Multiomix?'
                                answer={(
                                    <p>
                                        Multiomix is a cloud-based, open-source platform for investigating genomic and epigenomic
                                        events associated with the modulation of gene expression, with a focus on biomarker discovery
                                        and multi-omic analysis in cancer. It integrates data retrieval, aggregation, analysis, and
                                        visualization functions for both public and user-uploaded data. (<a href='#'>Paper</a>)
                                    </p>
                                )}
                            />

                            {/* Question 2: What kind of analysis can I do? */}
                            <FAQQuestionAndAnswer
                                segmentId='analysis-types'
                                headerTitle='What kind of analysis can I do in Multiomix?'
                                answer={(
                                    <p>
                                        Multiomix allows you to run correlation analyses between mRNA and other non-mRNA omic layers,
                                        particularly miRNA, DNA methylation, and CNA. It also includes survival analysis, statistical
                                        validations, model training, and inference on new datasets. In terms of biomarkers, the platform
                                        enables identifying, managing, and evaluating signatures composed of different omic variables,
                                        exploring their prognostic or predictive value, training models on those biomarkers, and
                                        reusing them for validation and inference on new cohorts.
                                    </p>
                                )}
                            />

                            {/* Question 3: Pipelines and statistical methods */}
                            <FAQQuestionAndAnswer
                                segmentId='pipelines'
                                headerTitle='What main pipelines and statistical methods does the platform offer?'
                                answer={(
                                    <>
                                        <p>
                                            The platform provides three core pipelines: miRNA-mRNA, DNA methylation-mRNA, and CNA-mRNA.
                                            In these workflows, users select datasets, filters, correlation method, and p-value adjustment,
                                            then explore results alongside clinical and follow-up information.
                                        </p>
                                        <p>
                                            For correlation, Multiomix supports Pearson, Spearman, and Kendall. For multiple testing
                                            correction, it supports Benjamini-Hochberg, Benjamini-Yekutieli, and Bonferroni, among others.
                                            Survival analyses such as Kaplan-Meier and Log-rank are also included to estimate the biological
                                            impact of detected events.
                                        </p>
                                        <p>
                                            A dedicated panel for biomarker management, optimization, and evaluation supports biomarkers
                                            composed of mRNA, miRNA, CNA, and methylation sites. It allows training clustering,
                                            Survival SVM, and Random Survival Forest models to assess prognostic or predictive power,
                                            and reusing already trained models for new validations and inferences without retraining from scratch.
                                            For existing biomarkers, the platform also offers optimization through multiple feature selection methods.
                                        </p>
                                    </>
                                )}
                            />

                            {/* Question 4: Uploading own data */}
                            <FAQQuestionAndAnswer
                                segmentId='upload-data'
                                headerTitle='Can I upload my own data?'
                                answer={(
                                    <p>
                                        Yes. Multiomix allows you to upload your own datasets in a validated manner, with format and
                                        consistency checks. It also offers batch uploads for large datasets and an interactive table
                                        with filters, search, pagination, sorting, and tagging to manage your data.
                                    </p>
                                )}
                            />
                            {/* Question 5: Public datasets */}
                            <FAQQuestionAndAnswer
                                segmentId='datasets-public'
                                headerTitle='Does Multiomix include ready-to-use public data?'
                                answer={(
                                    <p>
                                        Yes. The platform includes preloaded datasets retrieved programmatically from cBioPortal.
                                        This allows you to work with both public and private data in the same environment.
                                    </p>
                                )}
                            />

                            {/* Question 6: cBioPortal datasets preprocessing */}
                            <FAQQuestionAndAnswer
                                segmentId='datasets'
                                headerTitle='How are cBioPortal datasets incorporated and preprocessed?'
                                answer={(
                                    <>
                                        <p>
                                            Datasets from cBioPortal are synchronized regularly to ensure data consistency.
                                            If there is an update that we miss, users can contact us directly.
                                            Duplicate molecules are removed to keep the dataset clean.
                                            Samples without information for a given molecule in a biomarker are excluded from trained models,
                                            statistical validations, feature selection experiments, and inference steps.
                                        </p>
                                        <p>
                                            Clinical data also undergo preprocessing: cases with <code>NaN</code>, empty or <code>Null</code> values are filtered out.
                                            Additionally, cases with an event but survival time equal to zero are excluded (pending clarification from cBioPortal).
                                        </p>
                                    </>
                                )}
                            />
                            {/* Question 7: Only for experts? */}
                            <FAQQuestionAndAnswer
                                segmentId='expertise'
                                headerTitle='Is Multiomix only for expert bioinformaticians?'
                                answer={(
                                    <p>
                                        Not necessarily. Multiomix was designed to lower technical barriers and provide an accessible
                                        experience for non-expert users as well, without sacrificing analytical rigor. Its goal is to
                                        bring biomarker discovery closer to a broader range of research profiles through a friendly
                                        interface, clear documentation, and usage guides, within an open and technology-democratization-oriented approach.
                                    </p>
                                )}
                            />

                            {/* Question 8: Performance for correlation analysis */}
                            <FAQQuestionAndAnswer
                                segmentId='performance'
                                headerTitle='What makes Multiomix different in terms of correlation analysis performance?'
                                answer={(
                                    <p>
                                        For large-scale correlation analysis, Multiomix developed its own tool called{' '}
                                        <a href='https://github.com/' target='_blank' rel='noreferrer'>GGCA</a>, implemented
                                        in Rust to improve performance and memory usage.
                                    </p>
                                )}
                            />

                            {/* Question 9: Metaheuristics acceleration */}
                            <FAQQuestionAndAnswer
                                segmentId='metaheuristics'
                                headerTitle='How does Multiomix accelerate metaheuristic execution for feature selection?'
                                answer={(
                                    <p>
                                        Multiomix incorporates distributed computing optimizations over Apache Spark to accelerate
                                        the evaluation of metaheuristic agents in feature selection processes. It also includes
                                        internally developed distribution strategies designed to maximize the use of available
                                        resources and achieve the best possible performance. (<a href='#'>Source</a>)
                                    </p>
                                )}
                            />
                            {/* Question 10: Ecosystem integrations */}
                            <FAQQuestionAndAnswer
                                segmentId='integrations'
                                headerTitle='What ecosystem tools does Multiomix integrate with?'
                                answer={(
                                    <p>
                                        Multiomix relies on BioAPI and Modulector for part of its functionality. Both platforms act
                                        as abstraction layers for standardized access to biological data.{' '}
                                        <a href='https://github.com/' target='_blank' rel='noreferrer'>BioAPI</a> exposes gene
                                        nomenclature, expression, and pathway information through a REST API, while{' '}
                                        <a href='https://github.com/' target='_blank' rel='noreferrer'>Modulector</a> centralizes
                                        miRNA, gene, and methylation site data, and offers services related to PubMed evidence and news.
                                    </p>
                                )}
                            />
                            {/* Question 11: Internal technologies */}
                            <FAQQuestionAndAnswer
                                segmentId='technologies'
                                headerTitle='What technologies does Multiomix use internally?'
                                answer={(
                                    <p>
                                        Multiomix is built as a Python/Rust web application. It uses Django on the backend, React
                                        with TypeScript on the frontend, PostgreSQL for annotations, MongoDB for preloaded datasets,
                                        and Redis/WebSocket for asynchronous execution and notifications. Celery is used for task
                                        queues, with dependencies on Modulector and BioAPI. (
                                        <a href='https://github.com/' target='_blank' rel='noreferrer'>GitHub</a>)
                                    </p>
                                )}
                            />

                            <Divider />
                            {/* Question 12: Privacy */}
                            <FAQQuestionAndAnswer
                                segmentId='privacy'
                                headerTitle='How is user-uploaded data privacy handled?'
                                answer={(
                                    <p>
                                        Uploaded data is securely stored and only accessible to the uploading user.
                                        Once deleted, the data is permanently removed from our servers and cannot be recovered.
                                        No third parties have access to private user data.
                                    </p>
                                )}
                            />
                            {/* Question 13: Local installation */}
                            <FAQQuestionAndAnswer
                                segmentId='installation'
                                headerTitle='Can I install Multiomix locally?'
                                answer={(
                                    <p>
                                        Yes. Multiomix can be deployed locally and its official repository includes installation
                                        and development instructions, as well as support for quick deployments with Docker and
                                        complementary installation of BioAPI and Modulector. The project is distributed under
                                        the GPL-3.0 license, which promotes transparency, source code access, adaptability to
                                        specific needs, and open community collaboration. (
                                        <a href='https://github.com/' target='_blank' rel='noreferrer'>GitHub</a>)
                                    </p>
                                )}
                            />

                            <Divider />
                            {/* Question 14: Licenses */}
                            <FAQQuestionAndAnswer
                                segmentId='licenses'
                                headerTitle='Libraries and tools with Licenses'
                                answer={(
                                    <p>
                                        For legal and transparency reasons, we provide a list of third-party libraries and tools
                                        used in this platform, along with their respective licenses. This ensures compliance and
                                        acknowledgment of the open-source community contributions that power our ecosystem.
                                    </p>
                                )}
                            />
                            {/* Question 15: Additional Links */}
                            <FAQQuestionAndAnswer
                                segmentId='footer'
                                headerTitle='Additional Links'
                                answer={(
                                    <List horizontal divided link size='small'>
                                        <List.Item as='a'>Site Map</List.Item>
                                        <List.Item as='a'>Contact Us</List.Item>
                                        <List.Item as='a'>Terms and Conditions</List.Item>
                                        <List.Item as='a'>Privacy Policy</List.Item>
                                    </List>
                                )}
                            />

                            <Divider />

                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Container>
        </Base>
    )
}
