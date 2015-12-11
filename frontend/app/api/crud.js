'use strict';

var crud = {

  get: (url, params) => {
    return $.ajax({
      type: "GET",
      url: url,
      data: JSON.stringify(params)
    })
      .done(function(data) {
        return data;
      })
      .fail(function(data) {
        console.log('fail api status', data.status)
        return data;
      });
  },

  create: (url, params) => {
    return $.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(params),
      contentType:"application/json; charset=utf-8",
      dataType: 'json'
    })
      .done(function(data) {
        return data;
      })
      .fail(function(data) {
        console.log('fail api status', data.status)
        return data;
      });
  },

  update: (url, params) => {
    return $.ajax({
      type: "PUT",
      url: url,
      data: JSON.stringify(params),
      contentType:"application/json; charset=utf-8",
      dataType: 'json'
    })
      .done(function(data) {
        return data;
      })
      .fail(function(data) {
        console.log('fail api status', data.status)
        return data;
      });
  },

  delete: (url,params) => {
    return $.ajax({
      type: "DELETE",
      url: url,
      data: params
    })
      .done(function(data) {
        return data;
      })
      .fail(function(data) {
        console.log('fail api status', data.status)
        return data;
      });
  }
}

export default crud;
