/*!
 * jQuery QueryBuilder 2.3.0
 * Locale: English (en)
 * Author: Damien "Mistic" Sorel, http://www.strangeplanet.fr
 * Licensed under MIT (http://opensource.org/licenses/MIT)
 */

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'query-builder'], factory);
    }
    else {
        factory(root.jQuery);
    }
}(this, function($) {
"use strict";

var QueryBuilder = $.fn.queryBuilder;

QueryBuilder.regional['ch'] = {
  "__locale": "中国 (中国)",
  "__author": "Agx",
  "add_rule": "添加规则",
  "add_group": "添加组",
  "delete_rule": "删除",
  "delete_group": "删除",
  "conditions": {
    "AND": "和",
    "OR": "要么"
  },
  "operators": {
    "equal": "等于",
    "not_equal": "不平等",
    "in": "在",
    "not_in": "不",
    "less": "减",
    "less_or_equal": "小于或等于",
    "greater": "更大",
    "greater_or_equal": "大于或等于",
    "between": "之间",
    "not_between": "不间",
    "begins_with": "开始",
    "not_begins_with": "不以",
    "contains": "包含",
    "not_contains": "不含",
    "ends_with": "结尾",
    "not_ends_with": "有没有结束",
    "is_empty": "是空的",
    "is_not_empty": "不为空",
    "is_null": "空值",
    "is_not_null": "不为空"
  },
  "errors": {
    "no_filter": "没有选定的过滤器",
    "empty_group": "该集团是空的",
    "radio_empty": "没有选定值",
    "checkbox_empty": "没有选定值",
    "select_empty": "没有选定值",
    "string_empty": "空值",
    "string_exceed_min_length": "必须至少包含{0}个字符",
    "string_exceed_max_length": "不得含有超过{0}个字符",
    "string_invalid_format": "无效的格式（{0}）",
    "number_nan": "不是一个数字",
    "number_not_integer": "不是整数",
    "number_not_double": "不是实数",
    "number_exceed_min": "必须大于{0}",
    "number_exceed_max": "必须小于{0}",
    "number_wrong_step": "一定是的倍数{0}",
    "datetime_empty": "空值",
    "datetime_invalid": "无效的日期格式（{0}）",
    "datetime_exceed_min": "必须经过{0}",
    "datetime_exceed_max": "前必须{0}",
    "boolean_not_valid": "不是布尔",
    "operator_not_multiple": "操作{0}不能接受多个值"
  },
  "invert": "倒置"
};

QueryBuilder.defaults({ lang_code: 'ch' });
}));