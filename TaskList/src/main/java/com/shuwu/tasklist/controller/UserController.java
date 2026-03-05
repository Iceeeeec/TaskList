/**
 * 标题: UserController
 * 说明: 用户接口 - 登录/注册/获取信息
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.controller;

import com.shuwu.tasklist.common.Result;
import com.shuwu.tasklist.entity.SysUser;
import com.shuwu.tasklist.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public Result<?> login(@RequestBody Map<String, String> params) {
        String username = params.get("username");
        String password = params.get("password");
        SysUser user = userService.login(username, password);
        if (user == null) {
            return Result.fail("用户名或密码错误");
        }
        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getId());
        data.put("nickname", user.getNickname());
        data.put("avatar", user.getAvatar());
        // 简化处理，实际应生成 JWT token
        data.put("token", "token_" + user.getId());
        return Result.ok(data);
    }

    /**
     * 用户注册
     */
    @PostMapping("/register")
    public Result<?> register(@RequestBody Map<String, String> params) {
        String username = params.get("username");
        String password = params.get("password");
        String nickname = params.get("nickname");
        try {
            userService.register(username, password, nickname);
            return Result.ok();
        } catch (Exception e) {
            return Result.fail("注册失败：用户名已存在");
        }
    }

    /**
     * 获取当前用户信息
     * 简化处理：通过 header 中 userId 获取
     */
    @GetMapping("/info")
    public Result<?> info(@RequestHeader(value = "userId", defaultValue = "1") Long userId) {
        SysUser user = userService.getById(userId);
        if (user == null) {
            return Result.fail("用户不存在");
        }
        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId());
        data.put("username", user.getUsername());
        data.put("nickname", user.getNickname());
        data.put("avatar", user.getAvatar());
        return Result.ok(data);
    }
}
