/**
 * 标题: UserServiceImpl
 * 说明: 用户服务实现
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuwu.tasklist.entity.SysUser;
import com.shuwu.tasklist.mapper.SysUserMapper;
import com.shuwu.tasklist.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final SysUserMapper userMapper;

    @Override
    public SysUser login(String username, String password) {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getUsername, username)
                .eq(SysUser::getPassword, password);
        return userMapper.selectOne(wrapper);
    }

    @Override
    public void register(String username, String password, String nickname) {
        SysUser user = new SysUser();
        user.setUsername(username);
        user.setPassword(password);
        user.setNickname(nickname != null ? nickname : username);
        userMapper.insert(user);
    }

    @Override
    public SysUser getById(Long id) {
        return userMapper.selectById(id);
    }
}
