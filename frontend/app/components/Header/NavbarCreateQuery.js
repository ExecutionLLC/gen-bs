import React, { Component } from 'react';

import CreateQueryNavbarButton from './NavbarMain/CreateQueryNavbarButton'


export default class NavbarMain extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (

        <nav className="navbar navbar-fixed-top navbar-default">
            <div className="container-fluid">
                <div className="table-row">

                    
                  {/* 
                        {{> create_query/upload }}
                   
                    
                        {{> create_query/metadata_search }}
            

                  
                        {{> create_query/filters}}
                    
                        {{> create_query/views }}
                   
                   
                         
                        {{> create_query/analyze }}
                   
                        {{> create_query/load_history }}
                        */}
                   

                </div>
            </div>
        </nav>

    )
  }
}
