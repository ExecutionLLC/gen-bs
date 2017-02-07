import React from 'react';
import {Nav, NavDropdown, MenuItem} from 'react-bootstrap';
import ComponentBase from '../../shared/ComponentBase';
import _ from 'lodash';

import {setCurrentLanguageId} from '../../../actions/ui';


export default class LanguageDropdown extends ComponentBase {

    static LANGUAGE = [
        {name: 'English', languageId: 'en'},
        {name: 'Русский', languageId: 'ru'}
    ];

    static getLanguageNameForId(languageId) {
        return (_.find(this.LANGUAGE, {languageId}) || {name: '???'}).name;
    }

    render() {
        return (
            <div>
                <Nav>
                    <NavDropdown title={this.renderLanguageButtonTitle()}
                                 onSelect={(e, item) => this.onLanguageSelected(e, item)}
                    >
                        {_.map(LanguageDropdown.LANGUAGE, (languageInfo) => {
                            return (
                                <MenuItem
                                    key={languageInfo.languageId}
                                    eventKey={languageInfo.languageId}
                                >
                                    {languageInfo.name}
                                </MenuItem>
                            );
                        })}
                    </NavDropdown>
                </Nav>
            </div>
        );
    }

    renderLanguageButtonTitle() {
        const {languageId, p} = this.props;
        return (
            <span>
                <span className='hidden-xs'>{LanguageDropdown.getLanguageNameForId(languageId)}</span>
                <span className='visible-xs'>
                    <span className='dropdown-menu-header'>{p.t('navBar.selectLanguageTitle')}</span>
                    <i className='md-i md-language md-replace-to-close' />
                </span>
            </span>
        );
    }

    onLanguageSelected(event, languageId) {
        const {dispatch} = this.props;
        event.preventDefault();
        dispatch(setCurrentLanguageId(languageId));
    }
}

LanguageDropdown.propTypes = {
    dispatch: React.PropTypes.func.isRequired,
    languageId: React.PropTypes.string.isRequired,
    p: React.PropTypes.shape({t: React.PropTypes.func.isRequired}).isRequired
};
