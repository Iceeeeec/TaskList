/**
 * 标题: TagService
 * 说明: 标签服务接口
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.service;

import com.shuwu.tasklist.entity.TaskTag;
import java.util.List;

public interface TagService {

    /** 查询用户的标签列表 */
    List<TaskTag> listByUserId(Long userId);

    /** 新建标签 */
    void add(Long userId, String name, Integer colorIndex);

    /** 删除标签 */
    void delete(Long id, Long userId);
}
