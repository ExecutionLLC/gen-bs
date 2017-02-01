import React, {Component}  from 'react';
import {Popover, OverlayTrigger} from 'react-bootstrap';


import {createCommentAsync, updateCommentAsync, removeCommentAsync} from '../../actions/variantsTable';
import config from '../../../config';


export default class VariantsTableComment extends Component {
    constructor(props) {
        super(props);
        const {comments} = this.props;
        this.state = {
            comment: (_.isEmpty(comments)) ? '' : comments[0].comment
        };
    }

    renderComment() {
        const {comments} = this.props;
        return (
            <td className='comment'>
                <div>
                    {(_.isEmpty(comments)) ? ' ' : comments[0].comment}
                </div>
            </td>);
    }

    render() {
        const {auth, comments, searchKey, p} = this.props;
        if (auth.isDemo) {
            return (
                this.renderComment()
            );
        } else {
            return (
                <td className='comment'>
                    <OverlayTrigger
                        trigger='click'
                        ref='overlay'
                        rootClose={true}
                        placement='right'
                        container={this.props.tableElement}
                        overlay={
                            <Popover id={searchKey}>
                                {this.renderCommentPopover()}
                            </Popover>
                        }
                        onEnter={() => {
                            this.props.onPopupTriggered(true);
                        }}
                        onExiting={() => {
                            this.props.onPopupTriggered(false);
                        }}
                    >
                        <div>
                            <a className='btn-link-default editable editable-pre-wrapped editable-click editable-open'>
                                {(_.isEmpty(comments)) ? p.t('variantsTableAddComment') : comments[0].comment}</a>

                        </div>
                    </OverlayTrigger>
                </td>
            );
        }
    }

    onCommentChanged(e) {
        this.setState({
            comment: e.target.value
        });
    }

    onSaveClick(alt, pos, reference, chrom, searchKey, comment, comments) {
        if (_.isEmpty(comments)) {
            if (comment) {
                this.props.dispatch(createCommentAsync(alt, pos, reference, chrom, searchKey, comment));
            }
        } else if (comment) {
            this.props.dispatch(updateCommentAsync(comments[0].id, alt, pos, reference, chrom, searchKey, comment));
        } else {
            this.props.dispatch(removeCommentAsync(comments[0].id, searchKey));
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
            p
        } = this.props;

        const comment = this.state.comment;

        return (
            <div>
                <form className='form-inline editableform'>
                    <div className='control-group form-group'>
                        <div>
                            <div className=''>
                                    <textarea rows='7'
                                              placeholder={p.t('variantsTableCommentPlaceholder')}
                                              className='form-control material-input input-large'
                                              onChange={(e) => this.onCommentChanged(e)}
                                              defaultValue={(_.isEmpty(comments)) ? '' : comments[0].comment}
                                              maxLength={config.ANALYSIS.MAX_COMMENT_LENGTH}
                                    />
                            </div>
                            <div className='editable-buttons editable-buttons-bottom'>
                                <button type='button'
                                        className='btn btn-uppercase btn-link editable-submit'
                                        onClick={() => this.onSaveClick(alt, pos,
                                            reference, chrom, searchKey, comment, comments)}
                                >{p.t('variantsTableSaveComment')}
                                </button>
                                <button type='button'
                                        onClick={() => this.refs.overlay.toggle()}
                                        className='btn btn-uppercase btn-link editable-cancel'>
                                    {p.t('variantsTableCancelComment')}
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
    comments: React.PropTypes.array.isRequired,
    comment: React.PropTypes.string,
    reference: React.PropTypes.string.isRequired,
    pos: React.PropTypes.string.isRequired,
    alt: React.PropTypes.string.isRequired,
    searchKey: React.PropTypes.string.isRequired
};
