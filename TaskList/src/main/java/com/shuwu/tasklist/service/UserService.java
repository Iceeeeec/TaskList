/**
 * 标题: UserService
 * 说明: 用户服务接口
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.service;

import com.shuwu.tasklist.entity.SysUser;

public interface UserService {

    /** 登录 */
    SysUser login(String username, String password);

    /** 注册 */
    void register(String username, String password, String nickname);

    /** 根据ID获取用户信息 */
    SysUser getById(Long id);
}
