import React from 'react'
import { Container, Divider, Grid, Header, List } from 'semantic-ui-react'
import { Base } from '../Base'
import { FAQQuestionAndAnswer } from './FAQQuestionAndAnswer'
import { useIntl } from 'react-intl'

/**
 * Wrapper to make Context.Provider work.
 * @returns Component.
 */
const FAQWrapper = () => {
    const intl = useIntl()

    return (
        <>
            <Container text className='margin-top-2 margin-bottom-5'>
                <Grid stackable>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Header as='h1'>{intl.formatMessage({ id: 'faq.pageTitle' })}</Header>
                            <Divider />

                            {/* Question 1: What is Multiomix? */}
                            <FAQQuestionAndAnswer
                                segmentId='what-is-multiomix'
                                headerTitle={intl.formatMessage({ id: 'faq.whatIs.question' })}
                                answer={(
                                    <p>
                                        {intl.formatMessage({ id: 'faq.whatIs.answer' })} (
                                        <a href='#'>{intl.formatMessage({ id: 'faq.whatIs.link' })}</a>)
                                    </p>
                                )}
                            />

                            {/* Question 2: What kind of analysis can I do? */}
                            <FAQQuestionAndAnswer
                                segmentId='analysis-types'
                                headerTitle={intl.formatMessage({ id: 'faq.analysisTypes.question' })}
                                answer={(
                                    <p>
                                        {intl.formatMessage({ id: 'faq.analysisTypes.answer' })}
                                    </p>
                                )}
                            />

                            {/* Question 3: Pipelines and statistical methods */}
                            <FAQQuestionAndAnswer
                                segmentId='pipelines'
                                headerTitle={intl.formatMessage({ id: 'faq.pipelines.question' })}
                                answer={(
                                    <>
                                        <p>
                                            {intl.formatMessage({ id: 'faq.pipelines.p1' })}
                                        </p>
                                        <p>
                                            {intl.formatMessage({ id: 'faq.pipelines.p2' })}
                                        </p>
                                        <p>
                                            {intl.formatMessage({ id: 'faq.pipelines.p3' })}
                                        </p>
                                    </>
                                )}
                            />

                            {/* Question 4: Uploading own data */}
                            <FAQQuestionAndAnswer
                                segmentId='upload-data'
                                headerTitle={intl.formatMessage({ id: 'faq.uploadData.question' })}
                                answer={(
                                    <p>
                                        {intl.formatMessage({ id: 'faq.uploadData.answer' })}
                                    </p>
                                )}
                            />
                            {/* Question 5: Public datasets */}
                            <FAQQuestionAndAnswer
                                segmentId='datasets-public'
                                headerTitle={intl.formatMessage({ id: 'faq.datasetsPublic.question' })}
                                answer={(
                                    <p>
                                        {intl.formatMessage({ id: 'faq.datasetsPublic.answer' })}
                                    </p>
                                )}
                            />

                            {/* Question 6: cBioPortal datasets preprocessing */}
                            <FAQQuestionAndAnswer
                                segmentId='datasets'
                                headerTitle={intl.formatMessage({ id: 'faq.datasetsPreprocessing.question' })}
                                answer={(
                                    <>
                                        <p>
                                            {intl.formatMessage({ id: 'faq.datasetsPreprocessing.p1' })}
                                        </p>
                                        <p>
                                            {intl.formatMessage({ id: 'faq.datasetsPreprocessing.p2' })}
                                        </p>
                                    </>
                                )}
                            />
                            {/* Question 7: Only for experts? */}
                            <FAQQuestionAndAnswer
                                segmentId='expertise'
                                headerTitle={intl.formatMessage({ id: 'faq.expertise.question' })}
                                answer={(
                                    <p>
                                        {intl.formatMessage({ id: 'faq.expertise.answer' })}
                                    </p>
                                )}
                            />

                            {/* Question 8: Performance for correlation analysis */}
                            <FAQQuestionAndAnswer
                                segmentId='performance'
                                headerTitle={intl.formatMessage({ id: 'faq.performance.question' })}
                                answer={(
                                    <p>
                                        {intl.formatMessage({ id: 'faq.performance.answer' })}{' '}
                                        <a href='https://github.com/' target='_blank' rel='noreferrer'>GGCA</a>
                                    </p>
                                )}
                            />

                            {/* Question 9: Metaheuristics acceleration */}
                            <FAQQuestionAndAnswer
                                segmentId='metaheuristics'
                                headerTitle={intl.formatMessage({ id: 'faq.metaheuristics.question' })}
                                answer={(
                                    <p>
                                        {intl.formatMessage({ id: 'faq.metaheuristics.answer' })} (
                                        <a href='#'>{intl.formatMessage({ id: 'faq.metaheuristics.link' })}</a>)
                                    </p>
                                )}
                            />
                            {/* Question 10: Ecosystem integrations */}
                            <FAQQuestionAndAnswer
                                segmentId='integrations'
                                headerTitle={intl.formatMessage({ id: 'faq.integrations.question' })}
                                answer={(
                                    <p>
                                        {intl.formatMessage({ id: 'faq.integrations.answer' })}{' '}
                                        <a href='https://github.com/' target='_blank' rel='noreferrer'>BioAPI</a>{' '}
                                        <a href='https://github.com/' target='_blank' rel='noreferrer'>Modulector</a>
                                    </p>
                                )}
                            />
                            {/* Question 11: Internal technologies */}
                            <FAQQuestionAndAnswer
                                segmentId='technologies'
                                headerTitle={intl.formatMessage({ id: 'faq.technologies.question' })}
                                answer={(
                                    <p>
                                        {intl.formatMessage({ id: 'faq.technologies.answer' })} (
                                        <a href='https://github.com/' target='_blank' rel='noreferrer'>GitHub</a>)
                                    </p>
                                )}
                            />

                            <Divider />
                            {/* Question 12: Privacy */}
                            <FAQQuestionAndAnswer
                                segmentId='privacy'
                                headerTitle={intl.formatMessage({ id: 'faq.privacy.question' })}
                                answer={(
                                    <p>
                                        {intl.formatMessage({ id: 'faq.privacy.answer' })}
                                    </p>
                                )}
                            />
                            {/* Question 13: Local installation */}
                            <FAQQuestionAndAnswer
                                segmentId='installation'
                                headerTitle={intl.formatMessage({ id: 'faq.installation.question' })}
                                answer={(
                                    <p>
                                        {intl.formatMessage({ id: 'faq.installation.answer' })} (
                                        <a href='https://github.com/' target='_blank' rel='noreferrer'>GitHub</a>)
                                    </p>
                                )}
                            />

                            <Divider />
                            {/* Question 14: Licenses */}
                            <FAQQuestionAndAnswer
                                segmentId='licenses'
                                headerTitle={intl.formatMessage({ id: 'faq.licenses.question' })}
                                answer={(
                                    <p>
                                        {intl.formatMessage({ id: 'faq.licenses.answer' })}
                                    </p>
                                )}
                            />
                            {/* Question 15: Additional Links */}
                            <FAQQuestionAndAnswer
                                segmentId='footer'
                                headerTitle={intl.formatMessage({ id: 'faq.metaheuristics.link' })} // Usando link genérico o podrías crear faq.footer.title
                                answer={(
                                    <List horizontal divided link size='small'>
                                        <List.Item as='a'>{intl.formatMessage({ id: 'faq.footer.links.siteMap' })}</List.Item>
                                        <List.Item as='a'>{intl.formatMessage({ id: 'faq.footer.links.contact' })}</List.Item>
                                        <List.Item as='a'>{intl.formatMessage({ id: 'faq.footer.links.terms' })}</List.Item>
                                        <List.Item as='a'>{intl.formatMessage({ id: 'faq.footer.links.privacy' })}</List.Item>
                                    </List>
                                )}
                            />

                            <Divider />

                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Container>
        </>
    )
}

/**
 * FAQ Page (Frequently Asked Questions).
 * @returns Component.
 */
export const FAQ = () => {
    return (
        <Base activeItem='faq' wrapperClass='wrapper'>
            <FAQWrapper />
        </Base>
    )
}
