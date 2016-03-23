import React,{Component}  from 'react';
import {Popover,OverlayTrigger} from 'react-bootstrap'


import { createComment,updateComment } from '../../actions/variantsTable';


export default class CommentEditPopover extends Component {
    constructor(props) {
        super(props);

        this.state = {
            comment: ''
        };
    }

    renderDemoComment() {
        const {comments} = this.props;
        return (
            <td className="comment">
                <div>
                    {(_.isEmpty(comments)) ? ' ' : comments[0].comment}
                </div>
            </td>);
    }

    render() {
        const {auth, comments} = this.props;
        if (auth.isDemo) {
            return (
                this.renderDemoComment()
            );
        } else {
            return (
                <td className="comment">
                    <OverlayTrigger
                        trigger="click"
                        rootClose={true}
                        placement="right"
                        overlay={
                            <Popover>
                                {this.renderCommentPopover()}
                            </Popover>
                        }
                    >
                        <a title=""
                           data-original-title=""
                           class="btn-link-default comment-link editable editable-pre-wrapped editable-click editable-open"
                           data-type="textarea"
                           data-pk="1"
                           data-placeholder="Your comments here..."
                           data-placement="right">{(_.isEmpty(comments)) ? 'Add Comment' : comments[0].comment}</a>
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

    renderCommentPopover() {
        const {
            alt,
            pos,
            reference,
            chrom,
            search_key,
            comments
            } = this.props;

        const comment = this.state.comment

        return (<div className="fade right in editable-container editable-popup" role="tooltip">
            <div className="arrow"></div>
            <div className="popover-content">
                <div>
                    <form className="form-inline editableform">
                        <div className="control-group form-group">
                            <div>
                                <div className="">
                                    <textarea rows="7"
                                              placeholder="Your comments here..."
                                              class="form-control material-input input-large"
                                              onChange={(e) => this.onCommentChanged(e)}
                                              defaultValue={(_.isEmpty(comments)) ? '' : comments[0].comment}
                                    />
                                </div>
                                <div className="editable-buttons editable-buttons-bottom">
                                    <button type="button"
                                            className="btn btn-uppercase btn-link editable-submit"
                                            onClick={()=>{
                                                if(_.isEmpty(comments)){
                                                     this.props.dispatch(createComment(alt,pos,reference,chrom,search_key,comment))
                                                }else {
                                                    this.props.dispatch(updateComment(comments[0].id,alt,pos,reference,chrom,search_key,comment))
                                                  }
                                            }}
                                    >Save
                                    </button>
                                    <button type="button" className="btn btn-uppercase btn-link editable-cancel">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                            <div className="editable-error-block help-block"></div>
                        </div>
                    </form>
                </div>
            </div>
        </div>);
    }
}