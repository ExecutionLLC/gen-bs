import React, {Component} from 'react';

export default class Language extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (

            <div data-localize='language.help' data-toggle='tooltip' data-placement='left'
                 title='Change interface language'
                 data-container='body' data-trigger='hover'
                 className='hidden-xs'>
                <div className='dropdown language'>

                    <a href='#' className='btn navbar-btn dropdown-toggle' data-toggle='dropdown' role='button'><span
                        className='visible-xs' data-localize='language.lang_xs_En'>Eng</span><span className='hidden-xs'
                                                                                                   data-localize='language.lang_sm_En'>English </span><span
                        className='caret'></span></a>
                    <ul className='dropdown-menu'>
                        <li><a href='#' type='button' id='en_lang'><span
                            data-localize='language.lang_sm_En'>English</span></a>
                        </li>
                        <li><a href='#' type='button' id='ch_lang'><span
                            data-localize='language.lang_sm_Ch'>中国</span></a>
                        </li>
                    </ul>

                    <input type='hidden' id='curr_lang' value='en'/>
                </div>
            </div>

        );
    }
}
