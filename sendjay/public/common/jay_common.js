(function($) {
    window.hush = { //Authentication is handled by token(JWT) not by session management. 인증은 세션관리가 아닌 토큰(JWT)을 이용한 관리임.
        cons : { //#0886B6 => common color for image downloaded from flaticon.com
            title : "sendjay",
            app : "/jay", //web messenger's location.pathname
            route : "/route", //express routing. see DIR_ROUTE in app.js
            erp_portal : "erp_portal", //the site that talk embeded 
            logo_darkblue : "/img/sendjay_darkblue.png",
            logo_white : "/img/sendjay_white.png",
            img_noperson : "/img/noperson.png",
            pattern : /^[A-Za-z0-9!@^*(),.]*$/, //do not include # $ - _ % & + = ( //pattern excludes characters concerned with problem of uri malforming and jquery selector, so not worry about encodeURIComponent for that field) 
            deli : "##",
            subdeli : "$$",
            indeli : "','", //use this for sql where in clause
            easydeli : ";", //use this for absolutely safe place
            memdeli : " / ",
            deli_key : "__", //for setUser()
            w_key : 'W__', //Web userkey
            m_key : 'M__', //Mobile userkey            
            prefix : "$$", //for redis, socket
            worker_path : "/common/jay_worker.js",
            //3050(web ops),3051(mobile ops) and 3060(web dev),3061(mobile dev)
            //These ports are for one server dev/ops. Consult with your team for load balancing of the real enterprise environment.
            //서버 1대로 개발과 운영을 나누어 관리하기 위한 포트이며 정상적인 로드밸런싱이 필요한 실제 기업 환경에서는 사내 담당자와의 협의가 필요할 것임.
            socket_url : location.hostname + (location.port == 453 ? ":3060/jaydev" : ":3050/jayops"), 
            group_ay : ["admin", "ay"], //role group for hushsbay in private only
            group_main : ["admin", "main"], //role group
            invalid_push_token : "invalid_token", //same as server's
            tz_seoul : "Asia/Seoul", //for korean language
            fetch_cnt_list : 100, //At least, this should be the count which exceeds minimum rows with y-scroll .
            fetch_cnt : 100, //At least, this should be the count which exceeds minimum rows with y-scroll.
            fetch_first_cnt : 15, //At least, this should be the count which exceeds minimum rows with y-scroll.
            fetch_cnt_oneshot : 10000, //like search result
            restful_timeout : 10000, //same as mobile client
            max_member_for_org : 16, //temporary. same as server's
            max_filecount : 5, //uploading files
            max_filesize : 10485760, //10MB
            max_picture_size : 5242880, //5MB
            max_nicknm_len : 100, //same as server's
            max_msg_len : 4000, //bytes. check body field length same as server's
            max_size_to_sublink : 5242880, //5MB. same as server's
            unread_max_check : 1000,
            max_add_count : 100, //when connect after disconnect
            send_timeout_sec : 5,
            sock_ev_connect : "connect", //client use only
            sock_ev_mark_as_connect : "mark_as_connect", //client use only
            sock_ev_disconnect : "disconnect", //client use only
            sock_ev_alert : "alert",
            sock_ev_toast : "toast",
            sock_ev_common : "common",
            sock_ev_chk_alive_simple : "chk_alive_simple",
            sock_ev_show_off : "show_off",
            sock_ev_show_on : "show_on",
            sock_ev_create_room : "create_room",
            sock_ev_open_room : "open_room",
            sock_ev_qry_msglist : "qry_msglist",
            sock_ev_send_msg : "send_msg",
            sock_ev_read_msg : "read_msg", 
            sock_ev_qry_msgcell : "qry_msgcell",
            sock_ev_revoke_msgcell : "revoke_msgcell",
            sock_ev_delete_msg : "delete_msg",
            sock_ev_invite_user : "invite_user",
            sock_ev_rename_room : "rename_room",
            sock_ev_set_env : "set_env",
            sock_ev_chk_typing : "chk_typing",
            sock_ev_cut_mobile : "cut_mobile",
            tbl : "talk", //indexedDB
            fadein : "#b2e2f8",
            result_bgcolor : 'orange', 
            result_highlight : 'yellow',
            chat_handled : "file,flink,image,talk",
            cell_revoked : "message cancelled",
            file_expired : "expired", 
            sublink_ext_image : "png,gif,jpg,jpeg,ico",
            sublink_ext_video : "mp4", //file format which supports html5 streaming
            handling : ".. ", //handling..
            no_response : "no response",
            retry_sending : "retry sending",
            sending_failure : "check failure",
            left : " left this chat room",
            result_ok : "0",
            result_err : "-1",
            result_no_data : "-100",
            result_logout_needed_7 : "-7", //see chk_logout()
            result_logout_needed_8 : "-8", //see chk_logout()
            msg : {
                timeout : "timeout",
                error_occurred : "Unexpected error occurred. (ex: network disconnected)",
                no_data : "No data found.",
                no_more_data : "No more data found.",
                row_not_selected : "Row(s) not selected.",
                need_one_row_selected : "One row should be selected.",                
                blank_requested : "Blank requested.",
                some_char_not_allowed : "English, number and some special character accepted only."
            }
        },      
        auth : {
            setCookieForUser : (rs, _autoLogin, fromWebView) => { //called from web or mobile webview
                hush.http.setCookie("autologin", _autoLogin, true) //auto login or not (Y/N)
                hush.http.setCookie("token", rs.token, true) //jwt(JsonWebToken)
                hush.http.setCookie("userid", rs.userid, true)
                hush.http.setCookie("userkey", (fromWebView ? hush.cons.m_key : hush.cons.w_key) + rs.userid, true)
                hush.http.setCookie("passkey", rs.passkey, true) //See login.js
                hush.http.setCookie("usernm", rs.usernm, true)
                hush.http.setCookie("orgcd", rs.orgcd, true)
                hush.http.setCookie("role", rs.role, true)
            },
            deleteCookieForUser : () => {
                hush.http.deleteCookie('autologin')
                hush.http.deleteCookie('token')
                hush.http.deleteCookie('userid')
                hush.http.deleteCookie('userkey')
                hush.http.deleteCookie('passkey')
                hush.http.deleteCookie('usernm')
                hush.http.deleteCookie('orgcd')
                hush.http.deleteCookie('role')
            },
            chkAutoLogin : () => {
                return new Promise(async (resolve, reject) => {
                    try {
                        if (hush.http.getCookie("autologin") == "Y") {
                            const rs = await hush.http.ajax(hush.cons.route + "/login/verify") //See login.js : requested with cookie (jwt, userid and passkey but not with pwd)
                            if (rs.code == hush.cons.result_ok) hush.auth.setCookieForUser(rs, "Y")
                            resolve(rs)
                        } else {
                            resolve(null)
                        }
                    } catch (ex) {
                        reject(ex)
                    }
                })
            },
            login : function() { //dialog is from jqueryui
                return new Promise((resolve) => {
                    const _uid = hush.http.getCookie("userid") ? hush.http.getCookie("userid") : ""
                    const _style = "display:flex;flex-direction:column;align-items:center"
                    let _loginBody = "<div id=hush_dialog_login title='Authentication' style='" + _style + "'>"
                    _loginBody += " <input id=hush_userid spellcheck=false placeholder='Userid' value='" + _uid + "' style='width:150px;margin-top:20px' />"
                    _loginBody += " <input id=hush_pwd type='password'spellcheck=false placeholder='Password' style='width:150px;margin-top:20px' />"
                    _loginBody += " <label for='hush_auto_login' class=coSettingWrap style='border:0px;margin-top:10px'>"
                    _loginBody += "     <input type=checkbox id=hush_auto_login name='hush_auto_login' class=coSettingChkbox style='margin-left:0px' />"
                    _loginBody += "     <span id=hush_auto_login_label class=coSettingSpan>Auto Login</span>"
                    _loginBody += " </label>"
                    _loginBody += " <span id=spn_warn style='height:16px;color:red'></span>"
                    _loginBody += "</div>"
                    $("#hush_dialog_login").remove()
                    $(_loginBody).dialog({ resizable: false, height: "auto", width: 300, modal: true, closeOnEscape: false,
                        beforeClose: function(event, ui) {
                            if ($(this).data("login_pressed") != "Y") return false //cancelled when close icon clicked
                        },
                        buttons: [{ text: "Login", icon: "ui-icon-circle-check", click: async function() {                        
                            try {
                                const _userid = $("#hush_userid").val().trim()
                                const _pwd = $("#hush_pwd").val().trim()
                                if (_userid == "") {
                                    $("#spn_warn").html("Userid empty.")
                                    return
                                } //Special character (see hush.cons.pattern in jay_common.js) blocked in /user_manage.html in advance.
                                if (_pwd == "") {
                                    $("#spn_warn").html("Password empty.")
                                    return
                                }
                                const rq = { userid : _userid, pwd : _pwd }
                                const rs = await hush.http.ajax(hush.cons.route + "/login", rq)
                                if (rs.code != hush.cons.result_ok) {
                                    $("#spn_warn").html(rs.msg)
                                    return
                                }
                                const _autoLogin = $("#hush_auto_login").is(":checked") ? "Y" : "N"
                                hush.auth.setCookieForUser(rs, _autoLogin)
                                $("#hush_dialog_login").data("login_pressed", "Y")
                                $("#hush_dialog_login").dialog("close")
                                resolve(rs)
                            } catch (ex) {
                                $("#spn_warn").html(ex.message)
                            }
                        }}],
                        open: function() {
                            $("#hush_userid, #hush_pwd").keyup(function(e) { 
                                if (e.keyCode == 13 && !e.shiftKey) {
                                    $(this).parent().parent().find("button:eq(1)").trigger("click") //close icon button is at 0 position
                                }
                            })
                        }
                    })
                    if (!location.pathname.startsWith(hush.cons.app) && !location.pathname.startsWith("/" + hush.cons.erp_portal)) {
                        $("#hush_auto_login").attr("disabled", true)
                        $("#hush_auto_login").hide()
                        $("#hush_auto_login_label").hide()
                    }
                })
            },
            verifyLogin : () => {
                //Unlike chkAutoLogin(), this just verifies token to use messenger after logined. chkAutoLogin()과 달리 이미 로그인된 상태에서 토큰 체크하는 것임
                return new Promise(async (resolve, reject) => {
                    try {
                        const rs = await hush.http.ajax(hush.cons.route + "/login/verify")
                        if (rs.code == hush.cons.result_ok) hush.auth.setCookieForUser(rs, "Y")
                        resolve(rs)
                    } catch (ex) {
                        reject(ex)
                    }
                })
            },
            setUser : () => {
                const _token = hush.http.getCookie("token")
                const _id = hush.http.getCookie("userid")
                const _nm = hush.http.getCookie("usernm")
                const _orgcd = hush.http.getCookie("orgcd")
                const _key = hush.http.getCookie("userkey") //hush.cons.w_key + _id //for socket
                const _role = hush.http.getCookie("role") //'role' check in browser is just for convenience. Keep in mind that you should check this on server.
                return { key : _key, id : _id, nm : _nm, orgcd : _orgcd, token : _token, role : _role }
            }, 
            chk_logout : (code, msg) => { //console.log("####", code, msg)
                if (code.startsWith(hush.cons.result_logout_needed_7) || code.startsWith(hush.cons.result_logout_needed_8)) hush.auth.deleteCookieForUser()
            },
            chkRole : (roleList, roleItem) => {
                let ret = false
                if (typeof roleList != 'string') {
                    console.log('chkRole client: roleList should be type of string : ' + (typeof roleList))
                } else {
                    if (typeof roleItem == 'string') {
                        if ((',' + roleList + ',').includes(',' + roleItem + ',')) ret = true
                    } else if (Array.isArray(roleItem)) {
                        for (let i = 0; i < roleItem.length; i++) {
                            if ((',' + roleList + ',').includes(',' + roleItem[i] + ',')) {
                                ret = true
                                break
                            }
                        }
                    }
                }
                return ret
            }
        },
        http : {
            ajax : async (url, data, method, withToast) => {
                try {
                    if (withToast) hush.msg.toast("waiting..", false)
                    const rs = await hush.http.ajaxPromise(url, data, method)               
                    if (withToast) hush.msg.toastEnd()                    
                    return rs
                } catch (ex) {
                    if (withToast) hush.msg.toastEnd()
                    throw ex //new Error(ex.message)
                }
            },
            ajaxPromise : (url, data, method) => new Promise((resolve, reject) => {
                $.ajax({dataType : "json", //response data type
                    contentType : "application/json; charset=utf-8", //request mime type
                    url : url,
                    data: (method && method.toLowerCase() == "post") ? JSON.stringify(data) : data,
                    cache : false,
                    async : true,
                    type : (method) ? method : "get",
                    timeout : hush.cons.restful_timeout,
                    success : function(rs) {
                        resolve(rs)
                    },
                    error : function(xhr, status, error) {
                        //"Uncaught (in promise) Error" => status=error, error=""
                        //When done().fail(), "Uncaught (in promise) Error: error" returned
                        const msg = hush.http.getErrorMsg(status, error)
                        reject(new Error(msg))
                    }
                }
            )}),
            getErrorMsg : (status, error) => {
                if (status == "error") {
                    return "Network not available."
                } else if (status == hush.cons.msg.timeout) {
                    return "Unable to connect to server." 
                } else {
                    if (typeof error == "string") { 
                        return error 
                    } else {
                        return error.toString()
                    }
                }
            },
            ajaxCall : (url, data, method, callback, failCallback) => {
                $.ajax({dataType : "json", //response data type
                    contentType : "application/json; charset=utf-8", //request mime type
                    url : url,
                    data: (method && method.toLowerCase() == "post") ? JSON.stringify(data) : data,
                    cache : false,
                    async : true,
                    type : (method) ? method : "get",
                    timeout : hush.cons.restful_timeout,
                    success : function(rs) {
                        if (callback) callback(rs)
                    },
                    error : function(xhr, status, error) {
                        const msg = hush.http.getErrorMsg(status, error)
                        if (failCallback == false) {
                            //skip (like getting image)
                        } else if (failCallback) {
                            failCallback(msg)
                        } else {
                            hush.msg.alert("ajaxCall: " + msg)
                        }
                    }
                })
            },
            ajaxFormData : (url, fd, callback, failCallback) => { //File upload & download are not handled here.
                $.ajax({url: url,
                    data : fd,
                    processData : false,
                    enctype : "multipart/form-data",
                    contentType : false,
                    cache : false,
                    type : "POST",
                    success : function(rs) { 
                        if (callback) callback(rs)
                    },
                    error : function(xhr, status, error) { 
                        const msg = hush.http.getErrorMsg(status, error)
                        if (failCallback == false) {
                            //skip
                        } else if (failCallback) {
                            failCallback(msg)
                        } else {
                            hush.msg.alert("ajaxFormData: " + msg)
                        }
                    }
                })
            },
            setCookie : (name, value, persist) => {
                if (persist) { //expires value should be same as server's global.nodeConfig.jwt.expiry
                    $.cookie(name, value, { expires: 365, path: '/' })
                } else {
                    $.cookie(name, value, { path: '/' }) //session cookie
                }
            },
            deleteCookie : (name) => { //actually 'return' needed
                $.removeCookie(name, { path: '/' })
            },
            getCookie : (name) => {
                return $.cookie(name)
            },
            getParamsFromLocation : () => { //location.protocol(https:), location.hostname(xxx.com), location.port(8888), location.pathname, location.search(? included)
                const qsObj = { }
                const _qs = location.search.replace("?", "") //location.search needs encodeURIComponent from caller
                const _arr = _qs.split("&")
                for (let i = 0; i < _arr.length; i++) {
                    const _brr = _arr[i].split("=")
                    if (_brr.length > 1) {
                        qsObj[_brr[0]] = decodeURIComponent(_brr[1])
                    } else {
                        qsObj[_brr[0]] = ""
                    }
                }
                return qsObj
            },
            getBlobUrlForImage : (buffer, mimetype) => {
                const _mimetype = (mimetype) ? mimetype : "image/png"
                const uInt8Array = new Uint8Array(buffer)
                const blob = new Blob([uInt8Array], { type: _mimetype })
                const blobUrl = URL.createObjectURL(blob)
                return blobUrl
            },
            parseBlobUrl : (objUrl) => { //eg) data:image/png;base64,~
                let _ret = { mimetype : "", body : "" }
                var _header = objUrl.split(";base64,")
                if (_header.length == 2) {
                    const _data = _header[0].split(":")
                    if (_data[0] == "data") {
                        _ret.mimetype = _data[1] //eg) image/png
                        _ret.body = _header[1]
                    } else {
                        _ret = null
                    }
                } else {
                    _ret = null
                }
                return _ret
            },
            addPrefixForBlobUrl : (mimetype) => {
                const _mimetype = (mimetype) ? mimetype : "image/png"
                return "data:" + _mimetype + ";base64,"
            },
            runFromStandalone : () => {
                return location.pathname.startsWith(hush.cons.app) ? true : false //false means embeded talk
            },
            getUserPic : (userid, tagid) => {
                hush.http.ajaxCall(hush.cons.route + "/proc_picture", { type : "R", userid : userid }, "get", function(rsPic) {
                    if (rsPic.picture) {
                        const blobUrl = hush.http.getBlobUrlForImage(rsPic.picture.data)
                        $("#" + tagid).attr("src", blobUrl)
                    }
                }, false)
            },
            removeCache : (ver) => { //see redirect.js
                let _path = location.pathname
                if (!_path.endsWith(".html")) {
                    hush.msg.alert("removeCache: Html supported only for now.")
                    return
                }
                _path = _path.replace(".html", "")
                const arr = _path.split("/")
                let localName = arr[arr.length - 1]
                const _local = localStorage[localName] //chat=12345 => 12345
                if (!ver || _local == ver) { 
                    //'ver' once used is replaced with new version in redirect.js and cache is removed.
                    //한번 사용한 ver는 redirect.js를 통해 새로운 version으로 리다이렉트해서 캐시 제거됨.
                    if (location.search) {
                        location.replace(_path + location.search)
                    } else {
                        location.replace(_path)
                    }
                } else {
                    localStorage[localName] = ver
                }
            },
            fileDownload : (_path, msgid) => {
                let _fileUrl
                if ($("#ifr").length > 0) $("#ifr").remove()
                if (_path == "imagetofile") {
                    _fileUrl = hush.cons.route + "/get_msginfo?type=" + _path + "&msgid=" + msgid + "&suffix=" + hush.util.getCurDateTimeStr(false, true) //suffix used in mobile app
                } else {
                    _fileUrl = hush.cons.route + "/proc_file/" + decodeURIComponent(_path) + "?msgid=" + msgid
                }
                $("<iframe id=ifr src='" + _fileUrl + "' style='display:none;width:0px;height:0px;' />").appendTo("body") 
                hush.msg.toast("downloading..")
            }
        },
        idb : { //for mobile only
            db : null, 
            connect : (callback) => {
                if (!hush.idb.db) {
                    let conn = indexedDB.open("jay_mobile", 1) //Increment will trigger conn.onupgradeneeded (add version number if upgrade needed)
                    conn.onerror = function() {	
                        if (callback) callback({ code : "idb_conn_err", msg : "IndexedDB connect error: " + conn.errorCode })
                    }
                    conn.onupgradeneeded = function(e) { //field(roomid, msgid, body, sent, cdt)
                        hush.idb.db = e.target.result
                        let os
                        if (hush.idb.db.objectStoreNames.contains(hush.cons.tbl)) {
                            os = e.target.transaction.objectStore(hush.cons.tbl)
                        } else {
                            os = hush.idb.db.createObjectStore(hush.cons.tbl, { keyPath: "msgid" })
                        }
                        if (!os.indexNames.contains("roomid")) os.createIndex("roomid", "roomid", { unique : false }) //index 'roomid_cdt' failed to handle cursor
                        os.transaction.oncomplete = function(e) { 
                            if (callback) callback({ code : hush.cons.result_ok, msg : "IndexedDB upgraded" })
                        }
                    }
                    conn.onsuccess = function(e) {
                        hush.idb.db = conn.result
                        if (callback) callback({ code : hush.cons.result_ok, msg : "IndexedDB connected" })
                    }
                }
            }
        },
        msg : {
            alert : (desc, callbackObj, title, width) => { //dialog is from jqueryui               
                const _title = (title) ? title : "Alert"
                const _alertBody = "<div id='hush-dialog-confirm' title='" + _title + "'><p>" + desc + "</p></div>"
                const _width = (width) ? width : 300
                $("#hush-dialog-confirm").remove()
                if (!callbackObj) {
                    $(_alertBody).dialog({ resizable: false, height: "auto", width: _width, modal: true, 
                        buttons: { "Ok": function() { $("#hush-dialog-confirm").dialog("destroy") }}
                    })
                } else {
                    $(_alertBody).dialog({ resizable: false, height: "auto", width: _width, modal: true, 
                        buttons: callbackObj
                    })
                }
            }, //hush.msg.alert("OK!"); hush.msg.alert("OK?", { "Yes": function() { alert("OK") msg.close() }, "No": function() { msg.close() } }, "whowho", 200)
            inputBox : (desc, val, callbackObj, title, width) => { //dialog is from jqueryui     
                const _val = (val) ? val : ""
                const _title = (title) ? title : "Inputbox"
                let _body = "<div id='hush-dialog-confirm' title='" + _title + "'>"
                _body += "      <p>" + desc + "</p>"
                _body += "      <input id='hush_in' value='" + _val + "' spellcheck=false style='width:95%;margin-top:10px' />"
                _body += "   </div>"
                const _width = (width) ? width : 300
                $("#hush-dialog-confirm").remove()                
                $(_body).dialog({ resizable: false, height: "auto", width: _width, modal: true, 
                    buttons: callbackObj,
                    open: function() {
                        $("#hush_in").select()
                        $("#hush_in").keyup(function(e) { 
                            if (e.keyCode == 13 && !e.shiftKey) {
                                $(this).parent().parent().find("button:eq(1)").trigger("click") //close icon button is at 0 position
                            }
                        })
                    }
                })                             
            },
            getInput : () => {
                return $("#hush_in").val()
            },
            close : () => {
                $("#hush-dialog-confirm").dialog("destroy")
            },
            toast : (_text, _duration, overlay) => {
                if (overlay && $(".coOverlay").length > 0) return
                let _dur = (typeof _duration == "undefined" || _duration == null) ? 2 : _duration //false is no close
                _dur = (_dur == false) ? 6000 * 10 * 60 * 24 : _dur *= 1000 //false = sticky
                $("body").append("<div id=g_toast style='display:block;z-index=9999;max-width:60%;position:fixed;background:#da7444;color:#ffffff;border-radius:5px;padding:10px'></div>")
                const _toast = $("#g_toast")
                _toast.html(_text)
                _toast.css({
                    left : ($(window).outerWidth() / 2 ) - _toast.outerWidth() / 2,
                    top : ($(window).outerHeight() / 2 ) - _toast.outerHeight() / 2
                })
                if (overlay) $("body").append("<div class=coOverlay></div>")
                setTimeout(() => { 
                    _toast.remove()
                    $(".coOverlay").remove()
                }, _dur)
            },
            toastEnd : () => {
                const _toast = $("#g_toast")
                if (_toast.length > 0) {
                    _toast.remove()
                    $(".coOverlay").remove()
                }
                setTimeout(() => { 
                    if (_toast.length > 0) {
                        _toast.remove() 
                        $(".coOverlay").remove()
                    }
                }, 100)
            }
        },        
        noti : {
            notis : { },
            procNoti : async (roomid, obj) => { //This function should be called from index.html only or hush.user has to be replaced with another.
                if (hush.webview.on) return //covered at app notification
                if (hush.http.getCookie("notioff") == "Y") return //see setting tab
                if (obj.senderid == hush.user.id) return //skip for oneself when mobile
                if (obj.type == "leave") return //no need to be notified
                if (obj.type == "invite") {
                    const userids = hush.cons.memdeli + obj.body.split(hush.cons.deli)[1] + hush.cons.memdeli
                    const myuserid = hush.cons.memdeli + hush.http.getCookie("userid") + hush.cons.memdeli
                    if (!userids.includes(myuserid)) return //means that myuserid not invited and exists already in chat room
                }
                let _body, _from
                if (hush.room.map[roomid]) {
                    _from = hush.room.map[roomid].nm
                    if (hush.room.map[roomid].noti == "X") return
                } else {
                    const rs = await hush.http.ajax(hush.cons.route + "/get_roominfo", { roomid : roomid })                
                    if (rs.code == hush.cons.result_ok) {
                        _from = hush.room.getRoomName(rs.list[0].NICKNM, rs.list[0].MAINNM, rs.list[0].ROOMNM)
                        hush.room.map[roomid] = { nm: _from, noti: rs.list[0].NOTI }
                        if (hush.room.map[roomid].noti == "X") return
                    } else {
                        let _people = obj.receivernm.join(",") + ","
                        _people = _people.replace(hush.user.nm + ",", "")
                        if (_people.endsWith(",")) _people = _people.substr(0, _people.length - 1)
                        _from = _people
                    }
                }
                const msgArrived = "New message arrived."
                if (hush.http.getCookie("bodyoff") == "Y" && hush.http.getCookie("senderoff") == "Y") { //see setting tab
                    _body = msgArrived
                } else if (hush.http.getCookie("bodyoff") == "Y") {
                    _body = "[" + _from + "]\n" + msgArrived
                } else if (hush.http.getCookie("senderoff") == "Y") {
                    _body = hush.util.displayTalkBodyCustom(obj.type, obj.body)
                } else {
                    _body = "[" + _from + "]\n" + hush.util.displayTalkBodyCustom(obj.type, obj.body)
                }                 
                const noti = new window.Notification("", { body : _body, dir : "auto", lang : "EN", tag : roomid, icon : hush.cons.logo_darkblue, requireInteraction : true })
                noti.msgid = obj.msgid
                hush.noti.notis[roomid] = noti
                noti.onclick = function () {
                    hush.room.open(roomid, "noti")
                    noti.close()
                }
                noti.onclose = function () {
                    delete hush.noti.notis[roomid]
                }
            }            
        },
        people : {
            toggleDisplay : (userkey, on) => {
                if (on) {
                    $("#w_" + userkey).removeClass("coStateOff").addClass("coStateOn")
                    if ($("#m_" + userkey).hasClass("mobInstalled")) {
                        $("#m_" + userkey).removeClass("coStateMob").addClass("coStateOn")
                    } else {
                        $("#m_" + userkey).removeClass("coStateOff").addClass("coStateOn")
                    }
                } else {
                    $("#w_" + userkey).removeClass("coStateOn").addClass("coStateOff")
                    if ($("#m_" + userkey).hasClass("mobInstalled")) {
                        $("#m_" + userkey).removeClass("coStateOn").addClass("coStateMob")
                    } else {
                        $("#m_" + userkey).removeClass("coStateOn").addClass("coStateOff")
                    }
                }
            }
        },
        room : {
            map : { }, //{ nm: 'xxx', noti: true/false }
            create : (_type, uniqueStr) => { //newFromMain, newFromPopup, me
                const roomid = hush.util.createId(uniqueStr)
                const _newwin = window.open(hush.cons.app + "/chat?type=" + _type + "&roomid=" + roomid, "", "width=520,height=600,menubar=no,status=no,toolbar=no,resizable=yes,location=no")
                hush.sock.rooms[roomid] = _newwin
            },
            open : (roomid, origin) => { //origin=""(new),portal,noti
                const _win = hush.sock.rooms[roomid]
                if (_win) {
                    if (!_win.closed) {
                        _win.focus()
                        return
                    }
                    _win.close()
                    delete _win
                }
                const _newwin = window.open(hush.cons.app + "/chat?type=open&origin=" + origin + "&roomid=" + roomid, "", "width=520,height=600,menubar=no,status=no,toolbar=no,resizable=yes,location=no")
                hush.sock.rooms[roomid] = _newwin
            },
            getRoomName : (nicknm, mainnm, roomnm) => {
                if (nicknm) return nicknm //Member makes nick name in the chatroom.
                if (mainnm) return mainnm //Owner(Master=Creator) makes main name in the chatroom.
                const _roomnmObj = (typeof roomnm == "string") ? JSON.parse(roomnm) : roomnm
                return hush.room.procRoomName(_roomnmObj, g_userid) //Or member's name are displayed with some delimeter.
            },
            procRoomName : (_roomnmObj, _userid) => { //See setRoomnmWithUsernm() in common.js
                let finalnm             
                const _idx = _roomnmObj.userid.split(hush.cons.memdeli).indexOf(_userid)
                if (_idx == -1) {
                    finalnm = _roomnmObj.roomnm
                } else { //remove my name
                    const _arr = _roomnmObj.roomnm.split(hush.cons.memdeli)
                    let _brr = [ ]
                    for (let i = 0; i < _arr.length; i++) {
                        if (i != _idx) _brr.push(_arr[i])
                    }
                    finalnm = _brr.join(hush.cons.memdeli)
                }
                return finalnm
            },
            getAllRoomsOpen : (callback) => {
                Object.entries(hush.sock.rooms).forEach(([key, value]) => {
                    const _win = hush.sock.rooms[key]
                    if (_win && !_win.closed) callback(_win)
                })
            }
        },
        sock : {
            rooms : { }, //sock.connect => https://socket.io/docs/v3/client-initialization         
            connect : (io, query) => new Promise((resolve, reject) => { //this will be occurred only on index.html
                const socket = io(hush.cons.socket_url, { forceNew: false, reconnection: false, query: query }) //forceNew=false //See 'disconnect_prev_sock' in pmessage.js (on server)
        		socket.off("connect_error").on("connect_error", (e) => { hush.msg.alert("connect_error\n" + e.toString()) })
                socket.off("disconnect").on("disconnect", () => { 
                    location.replace("/" + hush.cons.erp_portal)
                }) 
                socket.off("connect").on("connect", () => {
                    console.log("socket connected")
                    hush.sock.on(socket, (rs) => {
                        console.log("chk => " + JSON.stringify(rs))
                        if (rs.returnTo == "parent" || rs.returnTo == "all") {
                            funcSockEv[rs.ev].call(null, rs.data)
                            if (rs.returnTo == "all") { //call from app.js or disconnect.js on server
                                Object.entries(hush.sock.rooms).forEach(([key, value]) => {
                                    const _win = hush.sock.rooms[key]
                                    if (_win && !_win.closed) _win.funcSockEv[rs.ev].call(null, rs.data)
                                })
                            }
                        } else { //to roomid
                            const _win = hush.sock.rooms[rs.returnTo]
                            if (_win && !_win.closed) _win.funcSockEv[rs.ev].call(null, rs.data)
                            if (rs.returnToAnother == "parent") funcSockEv[rs.ev].call(null, rs.data)
                        }
                    })
                    resolve(socket)
                })                
            }),
            send : (socket, ev, data, returnTo, returnToAnother) => {
                //returnTo should be one of 'parent','roomid','all' and 'parent' should be default
                //returnTo는 부모,해당채팅방,all을 의미하며 parent(부모)가 기본값임.
                //returnToAnother used when returnTo has roomid and data needed to be transferred to parent or others additionally (ie: sock_ev_invite_user)
                //returnTo는 예를 들어, 모든 채팅방+부모로 전송이 가능한데 returnToAnother는 한개 채팅방+부모로 전송이 가능함.
                const _returnTo = returnTo ? returnTo : "parent"
                socket.emit(hush.cons.sock_ev_common, { ev : ev, data : data, returnTo : _returnTo, returnToAnother : returnToAnother })
            },
            on : (socket, callback) => {            
                socket.off(hush.cons.sock_ev_alert).on(hush.cons.sock_ev_alert, (obj) => { 
                    if (!obj.roomid) {
                        hush.msg.alert("sock_ev_alert: " + obj.msg) 
                    } else {
                        hush.sock.rooms[obj.roomid].hush.msg.alert("sock_ev_alert: " + obj.msg)
                    }
                })
                socket.off(hush.cons.sock_ev_toast).on(hush.cons.sock_ev_toast, (obj) => {
                    if (!obj.roomid) {
                        hush.msg.toast("sock_ev_toast: " + obj.msg) 
                    } else {
                        hush.sock.rooms[obj.roomid].hush.msg.toast("sock_ev_toast: " + obj.msg)
                    }
                })
                socket.off(hush.cons.sock_ev_common).on(hush.cons.sock_ev_common, (rs) => { callback(rs) })
            }
        },
        socket : null,
        tz : Intl.DateTimeFormat().resolvedOptions().timeZone, //eg) Asia/Seoul, America/Toronto
        user : null, //from setUser()
        util : {
            isvoid : (obj) => {
                if (typeof obj == "undefined" || obj == null) return true
                return false
            },
            shuffleChar : (str) => {
                let arr = [...str]
                arr.sort(function() { return 0.5 - Math.random() })
                return arr.join("")
            },
            shuffleWord : (word) => {
                let shuffledWord = ''
                let _word = word.split('')
                while (_word.length > 0) shuffledWord += _word.splice(_word.length * Math.random() << 0, 1)
                return shuffledWord
            },
            createId : (uniqueStr) => {
                return hush.util.getCurDateTimeStr(false, true) + hush.util.getRnd().toString().padStart(6, "0") + (uniqueStr ? hush.util.shuffleChar(uniqueStr) : "")
            },
            chkSeoulTz : () => {
                if (hush.tz == hush.cons.tz_seoul) return true
                return false
            },
            getCurDateTimeStr : (deli, millisec) => {
                const now = new Date()
                let ret, _dot
				if (deli) {
					ret = now.getFullYear().toString() + "-" + (now.getMonth() + 1).toString().padStart(2, "0") + "-" + now.getDate().toString().padStart(2, "0") + " " + 
                          now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0") + ":" + now.getSeconds().toString().padStart(2, "0")
                    _dot = "."      
                } else {
					ret = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, "0") + now.getDate().toString().padStart(2, "0") + 
						  now.getHours().toString().padStart(2, "0") + now.getMinutes().toString().padStart(2, "0") + now.getSeconds().toString().padStart(2, "0")
                    _dot = ""
                }
                if (millisec) ret += _dot + now.getMilliseconds().toString().padEnd(6, "0")
                return ret
            },
            getTimeStamp : (str) => { //str = 2012-08-02 14:12:04
                const d = str.match(/\d+/g) //extract date parts
                return new Date(d[0], d[1] - 1, d[2], d[3], d[4], d[5])
            },
            getDateTimeDiff(_prev, _cur) { //_prev = yyyy-mm-dd hh:MM:dd
                const dtPrev = hush.util.getTimeStamp(_prev)
                return parseInt((_cur - dtPrev) / 1000) //return seconds
            },
            tzDateTime : (dt, dispSec) => { //see moment.js about timezone handling
                let _dt = ((dt.length > 19) ? dt.substr(0, 19) : dt) + "Z" //dt = UTC (YYYY-MM-DD hh:MM:ss or YYYY-MM-DD hh:MM:ssZ or YYYY-MM-DDThh:MM:ssZ)
                _dt = moment(_dt).tz(hush.tz).format() //returns 2020-07-19T11:07:00+09:00
                if (dispSec) {
                    return _dt.substr(0, 10) + " " + _dt.substr(11, 8)
                } else {
                    return _dt.substr(0, 10) + " " + _dt.substr(11, 5)
                }
            },
            getExpiryWithTZ : (filestate, cur_year) => {
                let _expiry
                if (filestate == "" || filestate == hush.cons.file_expired) {
                    _expiry = filestate
                } else {
                    _expiry = hush.util.tzDateTime(filestate, true)
                    _expiry = "until " + hush.util.formatMsgDt(_expiry, cur_year) //daemon kills periodically
                }
                return _expiry
            },
            formatMsgDt : (_dt, _year, onlyDate) => { //yyyy-mm-dd hh:mm:ss => consider tzDateTime first
                let dt 
                if (_dt.substr(0, 4) == _year) {
                    dt = _dt.substr(5, 11)
                 } else {
                    if (onlyDate) {
                        dt = _dt.substr(0, 10)
                    } else {
                        dt = _dt.substr(0, 16) //up to minutes
                    }
                 }
                 return dt
            },
            getRnd : (_min, _max) => {
                min = (!_min) ? 100000 : _min
                max = (!_max) ? 999999 : _max
                return Math.floor(Math.random() * (max - min)) + min //return min(inclusive) ~ max(exclusive) Integer only 
            },
            formatBytes : (bytes) => {
                let units = ["B", "KB", "MB", "GB", "TB"], i
                for (i = 0; bytes >= 1024 && i < 4; i++) bytes /= 1024
                return bytes.toFixed(2) + units[i]
            },
            utf8StrByteLength : function(s, b, i, c) { //https://programmingsummaries.tistory.com/239
                //for (b = i = 0; c = s.charCodeAt(i++); b += c >> 11 ? 3 : c >> 7 ? 2 : 1) => i++의 javascript es version propblem ?!
                for (b = i = 0; i < s.length; i++) {
                    c = s.charCodeAt(i)
                    b += c >> 11 ? 3 : c >> 7 ? 2 : 1
                }
                return b
            },
            chkFieldVal : (_val, _max, _min, _pattern, _nm) => {
                const nm = (_nm) ? "[" + _nm + "] " : ""
                if (_pattern) { //hush.cons.pattern excludes characters concerned with problem of uri malforming and jquery selector, so not worry about encodeURIComponent for that field
                    if (!hush.cons.pattern.test(_val)) {
                        hush.msg.alert(nm + hush.cons.msg.some_char_not_allowed)
                        return false
                    }
                }
                const _len = hush.util.utf8StrByteLength(_val)
                if (_max) {
                    if (_len > _max) {
                        hush.msg.alert(nm + "Max " + _max + " byte(s) exceeded : " + _len)
                        return false
                    }
                }
                if (_min) {
                    if (_val.trim() == "") {
                        hush.msg.alert(nm + "should not be blank")
                        return false
                    } else {
                        if (_len < _min) {
                            hush.msg.alert(nm + "Minimum " + _min + " byte(s) needed : " + _len)
                            return false
                        }
                    }
                }
                return true
            },
            removeTag : (_body) => {
                let body = _body
                body = body.replace(/</g, "&lt;")
                body = body.replace(/>/g, "&gt;")
                return body
            },
            winopen : (url, w, h) => {
                const _width = w ? w : "550"
                const _height = h ? h : "700"
                return window.open(url, "", "width=" + _width + ",height=" + _height + ",menubar=no,status=no,toolbar=no,resizable=yes,location=no")
            },
            animAction : function(tag, callback) { //jqueryui
                const _prevBackcolor = tag.css("background-color")
                tag.animate({ backgroundColor : hush.cons.fadein }, 100).animate({ backgroundColor : _prevBackcolor }, 500, null, callback)
            },            
            animateBgcolor : (menuStr, sec) => new Promise((resolve, reject) => {
                const _prevBackcolor = $("#" + menuStr).css("background-color")
                const _secStart = (sec) ? sec : 100
                const _secEnd = (sec) ? sec * 2 : 200
                $("#" + menuStr).animate({ backgroundColor : "#b2e2f8" }, _secStart).animate({ backgroundColor : _prevBackcolor }, _secEnd, null, resolve())
            }),
            animateOpacity : (menuStr) => new Promise((resolve, reject) => {
                $("#" + menuStr).animate({ opacity : 0.5 }, 100).animate({ opacity : 1.0 }, 200, null, resolve())
            }),
            animCall : async (menuStr, bgcolor, callback) => {
                if (bgcolor) {
                    await hush.util.animateBgcolor(menuStr)
                } else {
                    await hush.util.animateOpacity(menuStr)
                }
                if (callback) setTimeout(() => { callback() }, 300)
            },
            animTag : async (menuStr, callback) => {
                await nrs.util.animateBgcolor(menuStr, 1000)
                if (callback) setTimeout(() => { callback() }, 300)
            },
            getFileNameAndExtension : (fileStr) => {
				const obj = { }
				const arr = fileStr.split('.')
				obj.name = arr[0]
				if (arr.length == 1) {
					obj.ext = ''
					obj.extDot = ''	
				} else {
					obj.ext = arr[arr.length - 1]
					obj.extDot = '.' + arr[arr.length - 1]
				}
				return obj
            },
            extractFileFromTalkBody : (body) => { //from hush.A_MSGMS_TBL BODY Field value for file upload (xxroomid/xxuserid/realfilenamebody~~tempfilenamebody.extension##filesize)
                const _arr = body.split("/")
                const _brr = (_arr.length == 1) ? _arr[0].split(hush.cons.subdeli) : _arr[2].split(hush.cons.subdeli)
                const _crr = (_brr.length == 1) ? _brr[0].split(hush.cons.deli) : _brr[1].split(hush.cons.deli)
                return _brr[0] + hush.util.getFileNameAndExtension(_crr[0]).extDot
            },
            displayTalkBodyCustom : (type, body) => { //See ChatService.kt too.
                let _body
                if (body == hush.cons.cell_revoked) {
                    _body = body
                } else if (type == "invite") {
                    const _arr = body.split(hush.cons.deli)
                    _body = _arr[0] + " invited by " + _arr[2]
                } else if (type == "image") {
                    _body = type
                } else if (type == "file" || type == "flink") {
                    _body = hush.util.extractFileFromTalkBody(body)
                } else {
                    _body = body
                }
                return _body
            },
            chkEmoji : (str) => { //https://dev.to/melvin2016/how-to-check-if-a-string-contains-emojis-in-javascript-31pe
				if (/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi.test(str)) return true
				return false
			},
            isMobile : () => {
                if (/android|iphone|ipad/i.test(navigator.userAgent)) return true
                return false
            },
            getMobileOSVersion : (os) => { 
                //os => "Android" : Mozilla/5.0 (Linux; Android 11; SM-G977N) AppleWebkit/537.36 (KHTML, ~
                //os => iOS : not prepared yet
                const agent = navigator.userAgent + ";"
                const pos = agent.indexOf(os)
                if (pos == -1) return pos
                const posColon = agent.indexOf(";", pos)
                const ver = agent.substr(pos + os.length, posColon - (pos + os.length))
                return parseInt(ver.trim())
            }
        },
        webview : { //mobile web (if (/android|iphone|ipad/i.test(navigator.userAgent)) true) = webview
            on : false,
            ios : false,
            and : false,
            screenHeightOnLoad : null,
            chk : () => { //paramStr
                if (/android|iphone|ipad/i.test(navigator.userAgent)) {
                    hush.webview.on = true
                    if (/iphone|ipad/i.test(navigator.userAgent)) {
                        hush.webview.ios = true
                        hush.webview.and = false
                    } else {
                        hush.webview.ios = false
                        hush.webview.and = true
                    }
                    hush.webview.screenHeightOnLoad = $(window).height()
                } else {
                    hush.webview.on = false
                    hush.webview.ios = false
                    hush.webview.and = false
                }
            },
            ready : false,
        }
    }
})(jQuery)
