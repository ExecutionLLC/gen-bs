import React from 'react';
import classNames from 'classnames';

export default class FileUploadSampleList extends React.Component {
    render() {
        const {sampleList, currentSampleId} = this.props;
        return (
            <div className='split-scroll' >
                <ul id='analysisTabs' className='nav nav-componets nav-controls nav-radios'>
                    {this.renderNewListItem(currentSampleId ===null)},
                    {sampleList.map((sampleItem) => this.renderListItem(sampleItem.id === currentSampleId, sampleItem))}
                </ul>
            </div>
        );
    }

    renderNewListItem(isActive) {
        return (
            <li
                className={classNames({
                    'active': isActive
                })}
            >
                <a
                    type='button'
                    onClick={() => this.onSampleNewItem()}
                >
                    <label className='radio'>
                        <input type='radio' name='viewsRadios' />
                        <i />
                    </label>
                    <span className='link-label'>
                        New sample
                    </span>
                    <span className='link-desc'>
                        Upload vcf file
                    </span>
                </a>
            </li>
        );
    }

    renderListItem(isActive,sampleItem) {
        return (
            <li
                key={sampleItem.id}
                className={classNames({
                    'active': isActive
                })}
            >
                <a
                    type='button'
                    onClick={() => this.onSampleItemClick(sampleItem.id)}
                >
                    <label className='radio'>
                        <input type='radio' name='viewsRadios' />
                        <i />
                    </label>
                    <span className='link-label'>
                        {sampleItem.fileName}
                    </span>
                    <span className='link-desc'>
                        Test Description
                    </span>
                    <span className='small link-desc'>
                        <span data-localize='samples.sample_date'>
                            Uploaded
                        </span>: Some Date
                    </span>
                </a>
            </li>
        );
    }

    onSampleItemClick(id) {
        this.props.onSelectSample(id);
    }

    onSampleNewItem() {
        this.props.onSelectSample(null);
    }
}