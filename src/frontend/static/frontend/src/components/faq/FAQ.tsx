import React from 'react'
import { Container, Divider, Grid, Header, Segment, List } from 'semantic-ui-react'
import { Base } from '../Base'
import {FAQQuestionAndAnswer} from "./FAQQuestionAndAnswer";
 
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

               {/* Question 1: Datasets */}
              <FAQQuestionAndAnswer
                segmentId="datasets"
                headerTitle="How are cBioPortal datasets incorporated and preprocessed?"
                answer={
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
                }
              />
              
               {/* Question 2: Privacy */}
              <FAQQuestionAndAnswer
                segmentId="privacy"
                headerTitle="How is user-uploaded data privacy handled?"
                answer={
                  
                <p>
                  Uploaded data is securely stored and only accessible to the uploading user.
                  Once deleted, the data is permanently removed from our servers and cannot be recovered.
                  No third parties have access to private user data.
                </p>
                }
              />

              <Divider />

              {/* Question 3: Licenses */}
              <FAQQuestionAndAnswer
                segmentId="licenses"
                headerTitle="Libraries and tools with Licenses" 
                answer={
                  
                <p>
                   For legal and transparency reasons, we provide a list of third-party libraries and tools used in this platform,
                  along with their respective licenses. This ensures compliance and acknowledgment of the open-source
                  community contributions that power our ecosystem.
               
                </p>
            }
            />

              <Divider />

              {/* Question 4: Additional Links */}
              <FAQQuestionAndAnswer
                segmentId="footer"
                headerTitle="Additional Links"
                answer={
               
                <List horizontal divided link size='small'>
                  <List.Item as='a'>Site Map</List.Item>
                  <List.Item as='a'>Contact Us</List.Item>
                  <List.Item as='a'>Terms and Conditions</List.Item>
                  <List.Item as='a'>Privacy Policy</List.Item>
                </List>
              }
             
              />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    </Base>
  )
}
