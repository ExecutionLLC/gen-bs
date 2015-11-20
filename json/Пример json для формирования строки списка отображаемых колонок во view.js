{ "data": 
  [
        { 
          "text": "Section1 Name",
          "children":
            [
                { "id" : 1, "text" : "Column1-1 Name"},
                { "id" : 2, "text" : "Column1-2 Name"}
            ]
        },
        {
          "text": "Section2 Name",
          "children":
            [
                { "id" : 115, "text" : "Column2-1 Name"},
                { "id" : 116, "text" : "Column2-2 Name"},
                { "id" : 117, "text" : "Column2-3 Name"}
            ],
        },
        {
          "selected_item": [{ "id" : 115}],
          "disabled_items": [{ "id" : 115, "id" : 117, "id" : 119, "id" : 120}],
          "multi_sort_enable": 
            [
                { 
                  "column_id": 1,
                  "sort_direction": "asc",
                  "order": 1
                  }
            ],
          
          "all_keywords":  
            [
                { "сolumn_id": [
                    {
                      "keyword1": ["result_synonym1","result_synonym2", "result_synonym3", "result_synonym4" ],
                      "keyword2": ["result_synonym1","result_synonym2", "result_synonym3", "result_synonym4" ],
                      ....
                    }
                  ]                
                }

            ],
          "filter_control_enable": true,
          "filter_control_selected_keyswords": [
              { "сolumn_id": [
                    {
                      "keyword1": ["result_synonym1","result_synonym2", "result_synonym3", "result_synonym4" ],
                      "keyword2": ["result_synonym1","result_synonym2", "result_synonym3", "result_synonym4" ],
                      ....
                    }
                  ]
              }
          ],
        }
    ]
}

