/**
 * 标题: TagServiceImpl
 * 说明: 标签服务实现
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuwu.tasklist.entity.TaskTag;
import com.shuwu.tasklist.entity.TaskTagRel;
import com.shuwu.tasklist.mapper.TaskTagMapper;
import com.shuwu.tasklist.mapper.TaskTagRelMapper;
import com.shuwu.tasklist.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final TaskTagMapper tagMapper;
    private final TaskTagRelMapper tagRelMapper;

    @Override
    public List<TaskTag> listByUserId(Long userId) {
        LambdaQueryWrapper<TaskTag> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TaskTag::getUserId, userId);
        return tagMapper.selectList(wrapper);
    }

    @Override
    public void add(Long userId, String name, Integer colorIndex) {
        TaskTag tag = new TaskTag();
        tag.setUserId(userId);
        tag.setName(name);
        tag.setColorIndex(colorIndex != null ? colorIndex : 0);
        tagMapper.insert(tag);
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        // 删除标签
        LambdaQueryWrapper<TaskTag> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TaskTag::getId, id).eq(TaskTag::getUserId, userId);
        tagMapper.delete(wrapper);
        // 清除关联
        LambdaQueryWrapper<TaskTagRel> relWrapper = new LambdaQueryWrapper<>();
        relWrapper.eq(TaskTagRel::getTagId, id);
        tagRelMapper.delete(relWrapper);
    }
}
