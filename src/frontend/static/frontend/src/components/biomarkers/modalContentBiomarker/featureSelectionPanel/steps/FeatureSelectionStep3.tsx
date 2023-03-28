import React from 'react'
import { Select } from 'semantic-ui-react'

export const FeatureSelectionStep3 = () => {
    const options = [
        { key: 'Blind Search', text: 'Blind Search', value: 'Blind Search', disabled: false },
        { key: 'Cox Regression', text: 'Cox Regression', value: 'Cox Regression', disabled: true },
        { key: 'BBHA', text: 'BBHA', value: 'BBHA', disabled: true },
        { key: 'PSO', text: 'PSO', value: 'PSO', disabled: true }
    ]
    const options2 = [
        { key: 'Clustering', text: 'Clustering', value: 'Clustering', disabled: false },
        { key: 'SVM', text: 'SVM', value: 'SVM', disabled: false },
        { key: 'RF', text: 'RF', value: 'RF', disabled: true }
    ]
    return (
        <div>
            <Select
                className=''
                placeholder='Algorithm'
                name='moleculeSelected'
                options={options}
                value={1}
                onChange={(_, { value }) => console.log(value)}
            />
            <Select
                className=''
                placeholder='Fitness function'
                name='moleculeSelected'
                options={options2}
                value={1}
                onChange={(_, { value }) => console.log(value)}
            />
        </div>
    )
}
