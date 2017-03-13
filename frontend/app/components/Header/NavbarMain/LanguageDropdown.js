import React from 'react';
import {Nav, NavDropdown, MenuItem} from 'react-bootstrap';
import ComponentBase from '../../shared/ComponentBase';
import _ from 'lodash';

import {setCurrentLanguageId} from '../../../actions/ui';


export default class LanguageDropdown extends ComponentBase {

    getLanguageNameForId(languageId) {
        const {languages} = this.props;
        return (_.find(languages, {id: languageId}) || {description: '???'}).description;
    }

    render() {
        const {languages} = this.props;

        return (
            <div>
                <Nav>
                    <NavDropdown
                        id='languages-dropdown'
                        title={this.renderLanguageButtonTitle()}
                        onSelect={(e, item) => this.onLanguageSelected(e, item)}
                    >
                        {_.map(languages, (languageInfo) => {
                            return (
                                <MenuItem
                                    key={languageInfo.id}
                                    eventKey={languageInfo.id}
                                >
                                    {languageInfo.description}
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
                <span className='hidden-xs'>{this.getLanguageNameForId(languageId)}</span>
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
    languages: React.PropTypes.array.isRequired,
    p: React.PropTypes.shape({t: React.PropTypes.func.isRequired}).isRequired
};
