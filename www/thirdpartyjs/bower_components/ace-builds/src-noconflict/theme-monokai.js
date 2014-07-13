/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/monokai', ['require', 'exports', 'module', 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-monokai";
exports.cssText = ".ace-monokai .ace_editor {\
  border: 2px solid rgb(159, 159, 159)\
}\
\
.ace-monokai .ace_editor.ace_focus {\
  border: 2px solid #327fbd\
}\
\
.ace-monokai .ace_gutter {\
  background: #2f3129;\
  color: #f1f1f1\
}\
\
.ace-monokai .ace_print_margin {\
  width: 1px;\
  background: #555651\
}\
\
.ace-monokai .ace_scroller {\
  background-color: #272822\
}\
\
.ace-monokai .ace_text-layer {\
  color: #F8F8F2\
}\
\
.ace-monokai .ace_cursor {\
  border-left: 2px solid #F8F8F0\
}\
\
.ace-monokai .ace_cursor.ace_overwrite {\
  border-left: 0px;\
  border-bottom: 1px solid #F8F8F0\
}\
\
.ace-monokai .ace_marker-layer .ace_selection {\
  background: #49483E\
}\
\
.ace-monokai.multiselect .ace_selection.start {\
  box-shadow: 0 0 3px 0px #272822;\
  border-radius: 2px\
}\
\
.ace-monokai .ace_marker-layer .ace_step {\
  background: rgb(102, 82, 0)\
}\
\
.ace-monokai .ace_marker-layer .ace_bracket {\
  margin: -1px 0 0 -1px;\
  border: 1px solid #49483E\
}\
\
.ace-monokai .ace_marker-layer .ace_active_line {\
  background: #202020\
}\
\
.ace-monokai .ace_gutter_active_line {\
  background-color: #272727\
}\
\
.ace-monokai .ace_marker-layer .ace_selected_word {\
  border: 1px solid #49483E\
}\
\
.ace-monokai .ace_invisible {\
  color: #49483E\
}\
\
.ace-monokai .ace_entity.ace_name.ace_tag,\
.ace-monokai .ace_keyword,\
.ace-monokai .ace_meta,\
.ace-monokai .ace_storage {\
  color: #F92672\
}\
\
.ace-monokai .ace_constant.ace_character,\
.ace-monokai .ace_constant.ace_language,\
.ace-monokai .ace_constant.ace_numeric,\
.ace-monokai .ace_constant.ace_other {\
  color: #AE81FF\
}\
\
.ace-monokai .ace_invalid {\
  color: #F8F8F0;\
  background-color: #F92672\
}\
\
.ace-monokai .ace_invalid.ace_deprecated {\
  color: #F8F8F0;\
  background-color: #AE81FF\
}\
\
.ace-monokai .ace_support.ace_constant,\
.ace-monokai .ace_support.ace_function {\
  color: #66D9EF\
}\
\
.ace-monokai .ace_fold {\
  background-color: #A6E22E;\
  border-color: #F8F8F2\
}\
\
.ace-monokai .ace_storage.ace_type,\
.ace-monokai .ace_support.ace_class,\
.ace-monokai .ace_support.ace_type {\
  font-style: italic;\
  color: #66D9EF\
}\
\
.ace-monokai .ace_entity.ace_name.ace_function,\
.ace-monokai .ace_entity.ace_other.ace_attribute-name,\
.ace-monokai .ace_variable {\
  color: #A6E22E\
}\
\
.ace-monokai .ace_variable.ace_parameter {\
  font-style: italic;\
  color: #FD971F\
}\
\
.ace-monokai .ace_string {\
  color: #E6DB74\
}\
\
.ace-monokai .ace_comment {\
  color: #75715E\
}\
\
.ace-monokai .ace_markup.ace_underline {\
  text-decoration: underline\
}\
\
.ace-monokai .ace_indent-guide {\
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNQ11D6z7Bq1ar/ABCKBG6g04U2AAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
