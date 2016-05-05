import React, {Component} from 'react';

export default class Buy extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (

            <div data-toggle='tooltip' data-localize='account.buy.help' data-placement='left'
                 title='Buy featured options for genetic analises' data-container='body' data-trigger='hover'
                 className='hidden-xs'>
                <a href='#' className='btn navbar-btn' type='button' data-toggle='modal' data-target='#buy'><span
                    data-localize='buy.title'>Buy</span></a>
            </div>

        )
    }
}
