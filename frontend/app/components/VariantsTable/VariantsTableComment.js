import React, {Component, PropTypes}  from 'react';
import {Popover, OverlayTrigger} from 'react-bootstrap';

import {createCommentAsync, updateCommentAsync, removeCommentAsync} from '../../actions/variantsTable';
import config from '../../../config';
import * as i18n from '../../utils/i18n';


export default class VariantsTableComment extends Component {
    constructor(props) {
        super(props);
        const {comments, ui: {languageId}} = this.props;
        this.state = {
            comment: this.getCommentTextOrDefault(comments, languageId, '')
        };
    }

    getCommentText(comments, languageId) {
        return i18n.getEntityText(comments[0], languageId).comment;
    }

    getCommentTextOrDefault(comments, languageId, deafult) {
        return _.isEmpty(comments) ? deafult : this.getCommentText(comments, languageId);
    }

    renderReadonlyComment() {
        const {comments, ui: {languageId}} = this.props;
        return (
            <div>
                {this.getCommentTextOrDefault(comments, languageId, ' ')}
            </div>
        );
    }

    renderEditableComment() {
        const {comments, searchKey, ui: {languageId}, p, tableElement, onPopupTriggered} = this.props;
        return (
            <OverlayTrigger
                trigger='click'
                ref='overlay'
                rootClose={true}
                placement='right'
                container={tableElement}
                overlay={
                    <Popover id={searchKey}>
                        {this.renderCommentPopover()}
                    </Popover>
                }
                onEnter={() => onPopupTriggered(true)}
                onExiting={() => onPopupTriggered(false)}
            >
                <div>
                    <a className='btn-link-default editable editable-pre-wrapped editable-click editable-open'>
                        {this.getCommentTextOrDefault(comments, languageId, p.t('variantsTable.addComment'))}
                    </a>
                </div>
            </OverlayTrigger>
        );
    }

    render() {
        const {auth: {isDemo}} = this.props;
        return (
            <td className='comment'>
                {isDemo ?
                    this.renderReadonlyComment() :
                    this.renderEditableComment()
                }
            </td>
        );
    }

    onCommentChanged(e) {
        this.setState({
            comment: e.target.value
        });
    }

    onSaveClick(alt, pos, reference, chrom, searchKey, comment, comments) {
        const {dispatch} = this.props;
        if (_.isEmpty(comments)) {
            if (comment) {
                dispatch(createCommentAsync(alt, pos, reference, chrom, searchKey, comment));
            }
        } else if (comment) {
            dispatch(updateCommentAsync(comments[0], alt, pos, reference, chrom, searchKey, comment));
        } else {
            dispatch(removeCommentAsync(comments[0].id, searchKey));
        }

        this.refs.overlay.toggle();
    }

    renderCommentPopover() {
        const {
            alt,
            pos,
            reference,
            chrom,
            searchKey,
            comments,
            ui: {languageId},
            p
        } = this.props;

        const comment = this.state.comment;

        return (
            <div>
                <form className='form-inline editableform'>
                    <div className='control-group form-group'>
                        <div>
                            <div className=''>
                                <textarea
                                    rows='7'
                                    placeholder={p.t('variantsTable.commentPlaceholder')}
                                    className='form-control material-input input-large'
                                    onChange={(e) => this.onCommentChanged(e)}
                                    defaultValue={this.getCommentTextOrDefault(comments, languageId, '')}
                                    maxLength={config.ANALYSIS.MAX_COMMENT_LENGTH}
                                />
                            </div>
                            <div className='editable-buttons editable-buttons-bottom'>
                                <button
                                    type='button'
                                    className='btn btn-uppercase btn-link editable-submit'
                                    onClick={() => this.onSaveClick(alt, pos, reference, chrom, searchKey, comment, comments)}
                                >
                                    {p.t('variantsTable.saveComment')}
                                </button>
                                <button
                                    type='button'
                                    onClick={() => this.refs.overlay.toggle()}
                                    className='btn btn-uppercase btn-link editable-cancel'
                                >
                                    {p.t('variantsTable.cancelComment')}
                                </button>
                            </div>
                        </div>
                        <div className='editable-error-block help-block'></div>
                    </div>
                </form>
            </div>
        );
    }
}

VariantsTableComment.propTypes = {
    comments: PropTypes.array.isRequired,
    reference: PropTypes.string.isRequired,
    pos: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
    chrom: PropTypes.string.isRequired,
    searchKey: PropTypes.string.isRequired,
    tableElement: PropTypes.instanceOf(Component).isRequired,
    ui: PropTypes.object.isRequired,
    auth: PropTypes.object.isRequired,
    p: PropTypes.shape({t: PropTypes.func.isRequired}).isRequired,
    onPopupTriggered: PropTypes.func.isRequired
};
