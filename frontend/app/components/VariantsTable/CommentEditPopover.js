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

    renderAddCommentPopover() {
        const {alt,pos,reference,chrom,search_key} = this.props;
        console.log('AAAAA!');
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
                                    ></textarea>
                                </div>
                                <div className="editable-buttons editable-buttons-bottom">
                                    <button type="button"
                                            className="btn btn-uppercase btn-link editable-submit"
                                            onClick={()=>this.props.dispatch(createComment(alt,pos,reference,chrom,search_key,this.state.comment))}
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

    renderUpdateCommentPopover(id,comment) {
        const {alt,pos,reference,chrom,search_key} = this.props;
        console.log('AAAAA!');
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
                                              defaultValue = {comment}
                                    ></textarea>
                                </div>
                                <div className="editable-buttons editable-buttons-bottom">
                                    <button type="button"
                                            className="btn btn-uppercase btn-link editable-submit"
                                            onClick={()=>this.props.dispatch(updateComment(id,alt,pos,reference,chrom,search_key,this.state.comment))}
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

    render() {
        //return (<td className="comment"
        //            key="comment">
        //    <OverlayTrigger
        //        trigger="click"
        //        rootClose={true}
        //        placement="right"
        //        overlay={<Popover>{this.renderAddButton()}</Popover>}
        //    >
        //        <a title=""
        //           data-original-title=""
        //           class="btn-link-default comment-link editable editable-pre-wrapped editable-click editable-open"
        //           data-type="textarea"
        //           data-pk="1"
        //           data-placeholder="Your comments here..."
        //           data-placement="right">Add Comment</a>
        //    </OverlayTrigger>
        //</td>);
        return (
            this.renderComment()
        );
    }

    renderComment() {
        const {auth, comments} = this.props;
        if (auth.isDemo){
            const commentValue =(_.isEmpty(comments)) ? ' ' : comments[0].comment
            //return (
            //    <td className="comment"
            //        key="comment">
            //        <a title=""
            //           data-original-title=""
            //           class="btn-link-default comment-link editable editable-pre-wrapped editable-click editable-open"
            //           data-type="textarea"
            //           data-pk="1"
            //           data-placeholder="Your comments here..."
            //           data-placement="right"
            //           defaultValue>{commentValue}
            //        </a>
            //    </td>);
            return (
                <td className="comment">
                    <div>
                        {(_.isEmpty(comments)) ? ' ' : comments[0].comment}
                    </div>
                </td>);
        }else {
            if(_.isEmpty(comments)){
                return (<td className="comment"
                            key="comment">
                    <OverlayTrigger
                        trigger="click"
                        rootClose={true}
                        placement="right"
                        overlay={<Popover>{this.renderAddCommentPopover()}</Popover>}
                    >
                        <a title=""
                           data-original-title=""
                           class="btn-link-default comment-link editable editable-pre-wrapped editable-click editable-open"
                           data-type="textarea"
                           data-pk="1"
                           data-placeholder="Your comments here..."
                           data-placement="right">Add Comment</a>
                    </OverlayTrigger>
                </td>);
            }else {
                return (<td className="comment"
                            key="comment">
                    <OverlayTrigger
                        trigger="click"
                        rootClose={true}
                        placement="right"
                        overlay={<Popover>{this.renderUpdateCommentPopover(comments[0].id,comments[0].comment)}</Popover>}
                    >
                        <a title=""
                           data-original-title=""
                           class="btn-link-default comment-link editable editable-pre-wrapped editable-click editable-open"
                           data-type="textarea"
                           data-pk="1"
                           data-placeholder="Your comments here..."
                           data-placement="right">{comments[0].comment}</a>
                    </OverlayTrigger>
                </td>);
                //return (
                //    <td className="comment"
                //        key="comment">
                //        <a title=""
                //           data-original-title=""
                //           class="btn-link-default comment-link editable editable-pre-wrapped editable-click editable-open"
                //           data-type="textarea"
                //           data-pk="1"
                //           data-placeholder="Your comments here..."
                //           data-placement="right">
                //            {comments[0].comment}
                //        </a>
                //    </td>);
            }
        }
    }

    onCommentChanged(e) {
        this.setState({
            comment: e.target.value
        });
    }
}