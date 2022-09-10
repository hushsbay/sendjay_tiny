(function ($) {

    "use strict"

    //made by hushsbay@gmail.com in 2022.08
    //작은 아이콘때문에 좁아 보이는 일반적인 TreeView 대신 노드를 시원시원하게 커스터마이징하여, html로도 넣을 수 있고 노드내 아이콘 등도 변경할 수 있게 개발됨 (readOnly 전용)
    //모든 option은 여기 다 정의(alphabetical order)되며, 파일구조(dir + file)든 메뉴구조든 마지막 노드는 child로 정의해 구현한 것임을 유의 (depth=0이라도 마지막이면 child 개념)
    let backColorChildSel = "lightsteelblue", backColorParent = "ivory" //backColorChildSel=yellowgreen
    let customRow, expand = 0, fieldMatch
    let showCheckbox = false, showChildImg = false, showParentImg = false, idToClick = "", idToScroll = ""
    let imgChild = "doc.png", imgCheckbox = "selecton.png", imgCollapse = "minus.png", imgExpand = "plus.png", imgParent = "folder.png"
    let imgPath = ""
    let indent = 20, pathSeparator = "/", rowHeight = "45px", showMemberCount = false

    const wtArr = [] //wiseTreeView 전용 Array
    const evCheck = $.Event("wiseTreeOnCheck"), evClick = $.Event("wiseTreeOnClick")
    const evNodeShown = $.Event("wiseTreeNodeShown"), evNodeHidden = $.Event("wiseTreeNodeHidden")

    const alertForCustomRow = "customRow 오션 사용시에는 (s|g)etText, (s|g)etText1, (s|g)etText2 사용이 불가능합니다."

    function procExpCol(_expanded, _tag, _idx) {
        const _tagExpcol = $("#orgexpcol_" + _idx)
        if (_tagExpcol.css("display") == "none") _tagExpcol.show()
        if (_expanded == "Y") {
            _tag.attr("expanded", "N")
            _tagExpcol.attr("src", imgPath + imgExpand)
        } else {
            _tag.attr("expanded", "Y")
            _tagExpcol.attr("src", imgPath + imgCollapse)
        }
    }

    function collapse(targetDepth) { //원 데이터의 depth는 다양할 것이므로 (예: index from 1) wtArr의 depth 기준으로 처리됨. targetDepth에 해당하는 depth가 없을 수도 있음
        const _len = $(".orgrow").length
        for (let i = _len - 1; i >= 0; i--) {
            const _tag = $("#orgrow_" + i)
            const _depth = parseInt(_tag.attr("depth"))
            if (!targetDepth || targetDepth == 0) {
                if (_tag.attr("hasChildNode") == "Y") procExpCol("Y", _tag, i) //Y->N
                if (_depth > 0) {
                    _tag.hide()
                    _tag.attr("dispstate", "none")
                    list.trigger(evNodeHidden, { idx : i, depth : _depth })
                }
            } else if (_depth >= targetDepth) {
                if (_tag.attr("hasChildNode") == "Y") procExpCol("Y", _tag, i) //Y->N
                if (_depth > targetDepth) {
                    _tag.hide()
                    _tag.attr("dispstate", "none")
                    list.trigger(evNodeHidden, { idx : i, depth : _depth })
                }
            }
        }
    }

    function expandAll() {
        const _len = $(".orgrow").length
        for (let i = 0; i < _len; i++) {
            const _tag = $("#orgrow_" + i)
            const _depth = parseInt(_tag.attr("depth"))
            _tag.css("display", "flex")
            _tag.attr("dispstate", "flex")
            if (_tag.attr("hasChildNode") == "Y") procExpCol("N", _tag, i) //N->Y
            list.trigger(evNodeShown, { idx : i, depth : _depth })
        }
    }

    function procMain(opt, jsonArr, list) {
        try {
            if (!opt) return null
            if (!$.isArray(jsonArr)) return null //아래는 alphabetical order
            const _len = jsonArr.length
            if (_len == 0) return null
            if (opt.backColorChildSel) backColorChildSel = opt.backColorChildSel
            if (opt.backColorParent) backColorParent = opt.backColorParent
            if (opt.customRow) customRow = opt.customRow
            if (opt.expand) expand = opt.expand
            if (opt.fieldMatch) fieldMatch = opt.fieldMatch
            if (opt.showCheckbox) showCheckbox = opt.showCheckbox
            if (opt.showChildImg) showChildImg = opt.showChildImg
            if (opt.showParentImg) showParentImg = opt.showParentImg
            if (opt.idToClick) idToClick = opt.idToClick
            if (opt.idToScroll) idToScroll = opt.idToScroll
            if (opt.imgChild) imgChild = opt.imgChild
            if (opt.imgCheckbox) imgCheckbox = opt.imgCheckbox
            if (opt.imgCollapse) imgCollapse = opt.imgCollapse
            if (opt.imgExpand) imgExpand = opt.imgExpand
            if (opt.imgParent) imgParent = opt.imgParent
            if (opt.imgPath) {
                imgPath = opt.imgPath
            } else {
                if (!imgPath) throw new Error("imgPath 옵션이 필요합니다.")
            }
            if (!imgPath.endsWith("/")) imgPath += "/"
            if (opt.indent) indent = opt.indent
            if (opt.pathSeparator) pathSeparator = opt.pathSeparator
            if (opt.rowHeight) rowHeight = opt.rowHeight
            if (opt.showMemberCount) showMemberCount = opt.showMemberCount            
            const _objUpperLevel = {} //deciding child node's parent tag id            
            let _totalCount = 0, _childCount = 0
            for (let i = 0; i < _len; i++) {
                const row = jsonArr[i]
                let orgcd = (fieldMatch && typeof fieldMatch.id == "function") ? fieldMatch.id.call(null, row, i) : row.id
                if (typeof orgcd == "undefined") orgcd = i //그럼에도 불구하고 안되면 i를 인덱스로 잡기
                let orgnm = (fieldMatch && typeof fieldMatch.nm == "function") ? fieldMatch.nm.call(null, row, i) : row.nm
                let path =  (fieldMatch && typeof fieldMatch.path == "function") ? fieldMatch.path.call(null, row, i) : row.path
                if (typeof orgnm == "undefined" && typeof path != "undefined") {
                    const _brr = path.split(pathSeparator)
                    orgnm = _brr[_brr.length - 1]
                }
                if (typeof orgnm == "undefined") throw new Error("소스 데이터에 nm 또는 path 필드가 설정되어 있지 않습니다.")
                let depth, depthNext
                if (fieldMatch && typeof fieldMatch.depth == "function") {
                    depth = fieldMatch.depth.call(null, jsonArr[i], i)
                    depthNext = (i == _len - 1) ? -1 : fieldMatch.depth.call(null, jsonArr[i + 1], i)
                }
                if (typeof depth == "undefined" && typeof row.depth != "undefined") {
                    depth = row.depth
                    depthNext = (i == _len - 1) ? -1 : jsonArr[i + 1].depth
                }
                if (typeof depth == "undefined") {
                    if (typeof path != "undefined") {
                        const _brr = path.split(pathSeparator)
                        depth = _brr.length - 1
                        if (i == _len - 1) {
                            depthNext = -1
                        } else {
                            const _crr = jsonArr[i + 1].path.split(pathSeparator)
                            depthNext = _crr.length - 1
                        }
                    } else {
                        throw new Error("소스 데이터에 depth 필드 또는 path 필드 둘 중에 하나는 설정되어 있어야 합니다.")
                    }
                }
                let type = (i == _len - 1 || depthNext <= depth) ? "child" : "parent"
                let memcnt = (fieldMatch && typeof fieldMatch.memcnt == "function") ? fieldMatch.memcnt.call(null, row, i) : row.memcnt
                if (typeof memcnt == "undefined") memcnt = -1
                let text1 = (fieldMatch && typeof fieldMatch.text1 == "function") ? fieldMatch.text1.call(null, row, i) : row.text1
                if (typeof text1 == "undefined") text1 = ""
                let text2 = (fieldMatch && typeof fieldMatch.text2 == "function") ? fieldMatch.text2.call(null, row, i) : row.text2
                if (typeof text2 == "undefined") text2 = ""
                const _obj = { idx : i, id : orgcd, nm : orgnm, path : path, depth : depth, type : type, memcnt : memcnt, text1 : text1, text2 : text2 }
                wtArr.push(_obj)
                const isParent = (type == "parent") ? true : false
                let nodeBackColor, imgChildOrParent, dispChildOrParentImg
                if (isParent) {
                    nodeBackColor = ";background:" + backColorParent
                    imgChildOrParent = imgParent
                    dispChildOrParentImg = showParentImg ? "margin-left:2px" : "display:none"
                } else {
                    nodeBackColor = ""
                    imgChildOrParent = imgChild
                    dispChildOrParentImg = showChildImg ? "margin-left:2px" : "display:none"
                }
                let disp = "", hasChildNode = "Y", expanded = "", parentid = ""
                if (i == _len - 1 || depthNext <= depth) hasChildNode = "N" //if hasChildNode is "N" then 'expanded' has no effect at all
                if (expand <= 0) {
                    disp = (depth == 0) ? "flex" : "none"
                    if (hasChildNode == "Y") expanded = " expanded=N"
                } else if (expand > 99) {
                    disp = "flex"
                    if (hasChildNode == "Y") expanded = " expanded=Y"
                } else {
                    disp = (depth <= expand + 1) ? "flex" : "none"
                    if (hasChildNode == "Y") expanded = (depth <= expand) ? " expanded=Y" : " expanded=N"
                }
                if (depth > 0) { //if (depth > 0 && _objUpperLevel[depth - 1]) parentid = _objUpperLevel[depth - 1]
                    for (let k = 1; k <= 99; k++) { //depth가 0,1,3,4로 2가 없는 구조일 수도 있으므로 ..
                        if (_objUpperLevel[depth - k]) {
                            parentid = _objUpperLevel[depth - k]
                            break
                        }
                    }                    
                }
                const expcolImg = (expanded.includes("=Y")) ? imgCollapse : imgExpand
                const paddingLeft = 10 + depth * indent
                let _html = "<div id=orgrow_" + i + " orgcd=" + orgcd + " dispstate=" + disp + " hasChildNode=" + hasChildNode + " depth=" + depth + expanded + " memcnt=" + memcnt + " parent='" + parentid + "' class=orgrow "
                _html += "      style='height:" + rowHeight + ";display:" + disp + ";align-items:center" + nodeBackColor + ";cursor:pointer;border-bottom:1px solid lightgray;padding-left:" + paddingLeft + "px'>"
                const dispImg = (hasChildNode == "Y") ? "style='visibility:visible'" : "style='visibility:hidden'"
                let dispSelBox
                if (showCheckbox) {
                    dispSelBox = (isParent && memcnt == 0) ? "visibility:hidden" : "visibility:visible"
                } else {
                    dispSelBox = "display:none"                    
                }
                _html += "      <img id=orgexpcol_" + i + " src='" + imgPath + expcolImg + "' class='orgexpcol wiseTreeImg32' " + dispImg + " />"
                _html += "      <input type=checkbox wiseTree=Y id=orgsel_" + i + " class=orgsel style='" + dispSelBox + "' />"
                _html += "      <img id=orgImg_" + i + " src='" + imgPath + imgChildOrParent + "' class=wiseTreeImg18 style='" + dispChildOrParentImg + "' />"
                _html += "      <div id=orgbody_" + i + " class='wiseTreeDotDot orgbody' style='flex:1;min-width:0;max-height:50px;margin-left:8px'>"                   
                if (typeof customRow == "function") {
                    _html += customRow.call(null, row, wtArr[i], i)
                } else {
                    _html += "      <span id=orgnm" + orgcd + " style='line-height:50px;font-weight:bold'>" + orgnm + "</span>"
                    let dispCnt = (!showMemberCount || memcnt <= 0) ? "" : "(" + memcnt + ")"
                    _html += "      <span style='font-size:12px;color:darkgray;margin-left:10px'>" + dispCnt + "</span>"
                    _html += "      <span id=text1" + orgcd + " style='font-size:12px;color:blue;max-height:50px;margin-left:10px'>" + text1 + "</span>"
                    _html += "      <span id=text2" + orgcd + " style='font-size:12px;color:red;max-height:50px;margin-left:10px'>" + text2 + "</span>"
                }
                _html += "      </div>"
                list.append(_html)
                _objUpperLevel[depth] = "orgrow_" + i
                _totalCount += 1
                if (!isParent) _childCount += 1
            }
            $(".orgsel").off("change").on("change", function(e) { //e.stopPropagation() not worked since click event is one step ahead change event => changed to .orgbody from .orgrow
                const _self = $(this)
                const _idx = parseInt(this.id.substring(7))
                const curLevel = wtArr[_idx].depth
                const _bool = _self.prop("checked")
                if (_bool) { //dynamic
                    $(this).css("background-image", "url(" + imgPath + imgCheckbox + ")") 
                } else {
                    $(this).css("background-image", "") 
                }
                for (let i = _idx + 1; i < wtArr.length; i++) {
                    if (wtArr[i].depth <= curLevel) break
                    $("#orgsel_" + i).prop("checked", _bool)
                    if (_bool) { //dynamic
                        $("#orgsel_" + i).css("background-image", "url(" + imgPath + imgCheckbox + ")") 
                    } else {
                        $("#orgsel_" + i).css("background-image", "") 
                    }
                }	
                $(".wiseTreeRowSel").css("background", "")	        	
                $(".wiseTreeRowSel").removeClass("wiseTreeRowSel");
                if (wtArr[_idx].type == "child") {
                    $("#orgrow_" + _idx).addClass("wiseTreeRowSel")
                    $(".wiseTreeRowSel").css("background", backColorChildSel)
                }
                setTimeout(function() {
                    let cnt = 0
                    const checked = $(".orgsel:checked")
                    if (checked.length == 0) {
                        list.trigger(evCheck, { cntSel : 0 })
                    } else {
                        checked.each(function(idx, item) {
                            const _id = item.id.substring(7)
                            const _idx = parseInt(_id)
                            if (wtArr[_idx].type == "child") cnt += 1
                        }).promise().done(function () {
                            list.trigger(evCheck, { cntSel : cnt })
                        }) 
                    }
                }, 1)
            })
            $(".orgexpcol").off("click").on("click", function(e) {
                const _id = this.id //eg) orgexpcol_2
                const _idx = parseInt(_id.substring(10)) //eg) 2
                const _tag = $("#orgrow_" + _idx) //eg) orgrow_2
                const _depth = parseInt(_tag.attr("depth"))
                const _expanded = _tag.attr("expanded") //Y or ~
                const _hasChildNode = _tag.attr("hasChildNode") //Y or ~
                if (_hasChildNode == "Y") {
                    const _nextTag = $("#orgrow_" + (_idx + 1))
                    const depthNext = (_nextTag || _nextTag.length > 0) ? parseInt(_nextTag.attr("depth")) : -1
                    if (depthNext == -1 || depthNext <= _depth) { //case of last depth child
                        procExpCol(_expanded, _tag, _idx)
                    } else {
                        let j = 0, myChildFirstDepth = -1 //1) depth가 0,1,2,3이 아닌 0,2,3일 수도 있음
                        for (let i = _idx + 1; i < _len; i++) {
                            const _nextTag = $("#orgrow_" + i)
                            const depthNext = parseInt(_nextTag.attr("depth"))
                            if (depthNext <= _depth) break
                            if (myChildFirstDepth == -1) { //2) depth 1이 없고 2가 있으면 일단 기억
                                myChildFirstDepth = depthNext
                            } else if (depthNext < myChildFirstDepth) { //3) depth 1이 그 아래 뒤늦게 발견되면 depth 1을 기억
                                myChildFirstDepth = depthNext
                            }
                            let _dispstate
                            if (_expanded == "Y") { //if expanded, it should be collapsed (child nodes to hide and save their display state)
                                if (depthNext == myChildFirstDepth) { //if (depthNext == _depth + 1) {
                                    _dispstate = "none"
                                } else {
                                    _dispstate = _nextTag.css("display")
                                }
                                _nextTag.attr("dispstate", _dispstate)
                                _nextTag.hide()
                            } else {   
                                if (depthNext == myChildFirstDepth) { //if (depthNext == _depth + 1) {
                                    _dispstate = "flex"
                                    _nextTag.attr("dispstate", _dispstate)
                                } else {
                                    if ($("#" + _nextTag.attr("parent")).css("display") == "none") { //if parent node not displayed, child node should be not displayed too
                                        _dispstate = "none"
                                    } else { //or recall child node's display state
                                        _dispstate = _nextTag.attr("dispstate")
                                    }
                                }
                                _nextTag.css("display", _dispstate)
                            }
                            if (_dispstate == "none") {
                                list.trigger(evNodeHidden, { idx : i, depth : depthNext })
                            } else {
                                list.trigger(evNodeShown, { idx : i, depth : depthNext })
                            }
                            j += 1
                        }  
                        if (j > 0) procExpCol(_expanded, _tag, _idx)
                    }
                }
            })
            $(".orgbody").off("click").on("click", function(e) {
                const _id = this.id //eg) orgbody_2
                const _idx = parseInt(_id.substring(8)) //eg) 2
                $(".wiseTreeRowSel").css("background", "")
                $(".wiseTreeRowSel").removeClass("wiseTreeRowSel")
                if (wtArr[_idx].type == "child") {
                    $("#orgrow_" + _idx).addClass("wiseTreeRowSel")
                    $(".wiseTreeRowSel").css("background", backColorChildSel)
                }
                list.trigger(evClick, { row1 : jsonArr[_idx], row2 : wtArr[_idx] })
            })
            const targetId = idToClick || idToScroll //로드할 때 특정 아이디를 가진 노드 펼치기 및 스크롤 다운
            if (targetId) {                
                const _tag = $("div[orgcd='" + targetId + "']")
                const _id = parseInt(_tag[0].id.substring(7)) //orgrow_ + i
                if (_tag.attr("expanded") != "Y") {                    
                    const _obj = {}
                    for (let i = _id; i >= 0; i--) {
                        if (wtArr[i].type == "parent") {
                            if ($("#orgrow_" + i).attr("expanded") == "Y") break
                            if (!_obj[wtArr[i].depth]) _obj[wtArr[i].depth] = i
                        }
                    }
                    if (_obj) { //객체 키 소팅 굳이 필요없음
                        for (const [key, value] of Object.entries(_obj)) $("#orgexpcol_" + value).click()
                    }
                }
                const _scrollTop = list.scrollTop()
                list.scrollTop(_scrollTop + _tag.position().top - 30) //30=alpha값
                if (idToClick) $("#orgbody_" + _id).click()
            } //for (let i = 0; i < 100000; i++) { console.log(i) }
            return {
                jsonArr : wtArr,
                totalCount : _totalCount,
                childCount : _childCount,
                collapse : (targetDepth) => {
                    if (targetDepth < 0) return
                    collapse(targetDepth)
                },
                collapseAll : () => {
                    collapse()
                },
                expand : (targetDepth) => {
                    expandAll()
                    collapse(targetDepth)
                },
                expandAll : () => {
                    expandAll()
                },
                getText : (idx) => {
                    if (customRow) {
                        alert(alertForCustomRow)
                        return null
                    }
                    return $("#orgnm" + wtArr[idx].id).html()                    
                },
                getText1 : (idx) => {
                    if (customRow) {
                        alert(alertForCustomRow)
                        return null
                    }
                    return $("#text1" + wtArr[idx].id).html()                    
                },
                getText2 : (idx) => {
                    if (customRow) {
                        alert(alertForCustomRow)
                        return null
                    }
                    return $("#text2" + wtArr[idx].id).html()
                },
                setNodeLeftImage : (idx, src, width, height, ignoreIfSrcExists) => { //src = image path or blob
                    const _tag = $("#orgImg_" + idx.toString())
                    if (typeof width != "undefined") _tag.css("width", width)
                    if (typeof height != "undefined") _tag.css("height", height)
                    _tag.show()
                    if (ignoreIfSrcExists) {
                        _tag.attr("src", src)
                    } else {
                        const _src = _tag.attr("src")
                        if (_src.includes(imgPath + imgChild) || _src.includes(imgPath + imgParent)) { //기본적으로 imgChild or imgParent임
                            _tag.attr("src", src)
                        }
                    }                    
                }
            }
        } catch (ex) {
            console.log("[procMain] " + ex.stack)
            throw(ex)
        }
    }
    
    $.fn.wiseTreeView = function(opt, jsonArr, callback) {
        try {
            const list = $(this)
            list.empty()
            if (typeof callback == "function") {
                setTimeout(function() {
                    callback(procMain(opt, jsonArr, list))
                }, 100)                
            } else {
                return procMain(opt, jsonArr, list)
            }            
        } catch (ex) {
            console.log("[wiseTreeView] " + ex.stack)
            throw(ex)
        }
    }

    $.fn.wiseTreeViewAsync = function(opt, jsonArr) {
        const list = $(this)
        return new Promise((resolve, reject) => {
            try {
                list.empty()
                const ret = procMain(opt, jsonArr, list)
                resolve(ret)
            } catch (ex) {
                reject(ex)            
            }
        })
    }

})(jQuery)