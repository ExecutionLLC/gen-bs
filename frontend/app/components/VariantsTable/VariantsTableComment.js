import React,{Component}  from 'react';
import {Popover,OverlayTrigger} from 'react-bootstrap'


import { createComment,updateComment,removeComment } from '../../actions/variantsTable';


export default class VariantsTableComment extends Component {
    constructor(props) {
        super(props);
        const {comments} = this.props;
        this.state = {
            comment: (_.isEmpty(comments)) ? '' : comments[0].comment
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
        const {auth, comments, search_key} = this.props;
        if (auth.isDemo) {
            return (
                this.renderDemoComment()
            );
        } else {
            return (
                <td className="comment">
                    <OverlayTrigger
                        trigger="click"
                        ref="overlay"
                        rootClose={true}
                        placement="right"
                        overlay={
                            <Popover id={search_key}>
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

        return (
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
                                                    if(comment){
                                                        this.props.dispatch(createComment(alt,pos,reference,chrom,search_key,comment));
                                                    }

                                                }else {
                                                    if (comment){
                                                        this.props.dispatch(updateComment(comments[0].id,alt,pos,reference,chrom,search_key,comment));
                                                    }else {
                                                        this.props.dispatch(removeComment(comments[0].id,search_key));
                                                    }
                                                }
                                                this.refs.overlay.toggle();
                                            }}
                                    >Save
                                    </button>
                                    <button type="button"
                                            onClick={()=>this.refs.overlay.toggle()}
                                            className="btn btn-uppercase btn-link editable-cancel">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                            <div className="editable-error-block help-block"></div>
                        </div>
                    </form>
                </div>
        );
    }
}