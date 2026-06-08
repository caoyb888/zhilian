-- ==========================================
-- 绿产智链 portal 数据迁移脚本
-- 来源: https://www.glca.org.cn/ (协会旧站)
-- 生成时间: 2026-06-06
-- ==========================================

USE gl_portal;

-- 1. 初始化栏目 (若不存在)
INSERT IGNORE INTO portal_category (id, parent_id, name, code, sort_order, is_visible, created_at, updated_at) VALUES
  (1, NULL, '新闻中心', 'NEWS', 1, 1, NOW(), NOW()),
  (2, NULL, '通知公告', 'NOTICE', 2, 1, NOW(), NOW()),
  (3, NULL, '政策法规', 'POLICY', 3, 1, NOW(), NOW()),
  (4, NULL, '活动专区', 'ACTIVITY', 4, 1, NOW(), NOW());

-- 2. 新闻中心 (category_id=1)
INSERT INTO portal_article
  (category_id, title, content, summary, cover_url, author, view_count, is_top, is_published, published_at, publisher_id, is_deleted, created_at, updated_at)
VALUES
  (1, '王向东到访秘书处：统一思想、规范管理、做实工作', '<p style="text-align: center;">&nbsp; &nbsp;<img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/8a7414d23a6e47389f7fbfe50f013f64cw87kbpt0h.png" /></p>
<p>&nbsp; &nbsp; 3月16日下午，<span class="wx_search_keyword_wrap">山钢集团</span>党委常委、副总经理王向东来到秘书处，专题调研协会一季度工作进展，为2026年重点任务定调子、压担子、开方子。协会理事、<span class="wx_search_keyword_wrap">山钢资本控股</span>首席经济学家王来星参加。</p>
<p>&nbsp; &nbsp; 党浅首先汇报了《协会2026年重点工作总体规划》，随后五大职能部门负责人围绕&ldquo;绿动齐鲁&middot;千企行&rdquo;调研、&ldquo;金石榜&rdquo;好产品评选、&ldquo;绿洽会&rdquo;方案设计、专委会建设、碳资产开发等五条主线，晒进度、摆问题、提建议。王来星就产业基金工作作汇报。现场气氛热烈务实，既有对目标的坚定承诺，也有对难关的坦诚剖析，更有对解决方案的深入探讨。</p>
<p>&nbsp; &nbsp; 王向东对秘书处成立以来的工作给予充分肯定。他说，秘书处虽然人不多、成立时间不长，还在打基础的阶段，但&ldquo;想干事、能干事、干成事&rdquo;的氛围已经形成，各项工作既&ldquo;快&rdquo;，又&ldquo;实&rdquo;。</p>
<p>&nbsp; &nbsp; 对下一步工作，他提出三点要求：</p>
<p>&nbsp; &nbsp; 一是迅速统一思想行动。协会的根在会员，魂在服务，要深入贯彻&ldquo;会员办会、会长管会、专业立会、治理强会、价值兴会&rdquo;的宗旨，把准&ldquo;为会员创造价值<span data-pm-slice="1 1 [&quot;para&quot;,{&quot;tagName&quot;:&quot;p&quot;,&quot;attributes&quot;:{&quot;style&quot;:&quot;text-indent: 2em;margin-top: 8px;&quot;},&quot;namespaceURI&quot;:&quot;http://www.w3.org/1999/xhtml&quot;}]">&rdquo;</span>的定位，认真思考&ldquo;价值体现在哪些方面&rdquo;，明确协会的主责主业，以高标准、严要求、快节奏、创一流，兑现对会员的承诺。</p>
<p>&nbsp; &nbsp; 二是加快抓好规范建设。规范建设是国家的要求、会员企业的期盼。审计不是终点，整改才是关键。要以审计整改为契机，完善制度建设、治理结构，把&ldquo;三重一大&rdquo;决策机制、党组织建设、绩效管理体系一项一项建起来、用起来，只有&ldquo;透明、规范、高效&rdquo;，协会才能立得住，才能经得起会员的审视、历史的检验。</p>
<p>&nbsp; &nbsp; 三是全力推进重点工作。供需平台抓到了点子上，要一抓到底。&ldquo;绿动齐鲁&middot;千企行&rdquo;调研，核心是&ldquo;把服务送下去、把需求收上来&rdquo;；&ldquo;金石榜&rdquo;<span data-pm-slice="1 1 [&quot;para&quot;,{&quot;tagName&quot;:&quot;p&quot;,&quot;attributes&quot;:{&quot;style&quot;:&quot;text-indent: 2em;margin-top: 8px;&quot;},&quot;namespaceURI&quot;:&quot;http://www.w3.org/1999/xhtml&quot;}]">&ldquo;<span class="wx_search_keyword_wrap">绿洽会</span>&rdquo;</span>，目标是&ldquo;把品牌立起来、把标杆树起来&rdquo;；会员管理要落到&ldquo;一企一表&rdquo;，专委会、专家智库、产业基金、碳资产管理要一件一件做实。每项工作都要有清单、有节点、有反馈，让服务从&ldquo;纸面&rdquo;落到&ldquo;地面&rdquo;，让会员看得见、摸得着、用得上。</p>', '3月16日下午， 山钢集团 党委常委、副总经理王向东来到秘书处，专题调研协会一季度工作进展，为2026年重点任务定调子、压担子、开方子。协会理事、 山钢资本控股 首席经济学家王来星参加。 党浅首先汇报了《协会2026年重点工作总体规划》，随后五大职能部门负责人围绕“绿动齐鲁·千企行”调研、“金石榜”...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/8a7414d23a6e47389f7fbfe50f013f64cw87kbpt0h.png', 'admin', 47, 0, 1, '2026-03-18 08:00:00', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00'),
  (1, '先行起航，碳路先锋——协会双碳实战训练营圆满收官', '<p>&nbsp; &nbsp; &nbsp; 5月22日，由山东省绿色低碳产业发展协会（以下简称&ldquo;协会&rdquo;）主办的&ldquo;先行学堂&middot;碳路先锋&rdquo;企业双碳实战训练营在济南成功举办。作为协会&ldquo;<span class="wx_search_keyword_wrap">先行学堂</span>&rdquo;培训品牌的首期课程，本次训练营汇聚了全国碳市场三大核心基础设施的权威专家，为来自全省钢铁、化工、能源、金融、装备制造等行业的近百名企业代表带来了一场&ldquo;手把手教操作、面对面解疑惑&rdquo;的双碳实战盛宴。</p>
<p style="text-align: center;"><strong>全国三大碳市场系统专家首次联袂，打造实战盛宴</strong></p>
<p style="text-align: center;"><strong><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/cf94f755841641c4a28970bcfda52a4fehci85edsd.png" /></strong></p>
<p>&nbsp; &nbsp; &nbsp; 本次训练营实现了山东绿色低碳培训领域的一次重要突破&mdash;&mdash;上海环境能源交易所、<span class="wx_search_keyword_wrap">北京绿色交易所</span>、中国碳排放权登记结算中心（武汉）的专家首次在同一场培训中联袂授课。这三大系统分别承担着全国碳市场的CEA交易、<span class="wx_search_keyword_wrap">CCER交易</span>和碳配额登记结算职能，是碳市场运行的核心基础设施。协会通过自身资源整合能力，将三大平台的权威专家汇聚一堂，为山东企业提供了一次&ldquo;一站式&rdquo;对接全国碳市场核心资源的机会。</p>
<p style="text-align: center;"><strong><span style="font-family: 方正仿宋_GB2312;">课程设置紧扣实操痛点，五位专家各授</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;通关秘籍&rdquo;</span></strong></p>
<p style="text-align: center;"><strong><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ce2ce638ab20458b81c611f1cf7f8160fhgayy2qri.png" /></strong></p>
<p style="text-align: left;"><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; &nbsp; &nbsp;本次训练营的课程设计不讲概念、只讲操作，围绕企业在碳市场一线面临的五大核心难题，五位专家分别从注册登记、交易操作、</span><span style="font-family: 方正仿宋_GB2312;">CCER抵消、<span class="wx_search_keyword_wrap">碳关税应对</span>、法律合规五个维度，为企业提供了可落地、可复用的实操方案。</span></p>
<p style="text-align: left;"><span style="font-family: 方正仿宋_GB2312;"><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/49d4c937f15543939ece985e4383c4548h6il0flkq.png" /></span></p>
<p style="text-align: left;"><span style="font-family: 方正仿宋_GB2312;"><strong>&nbsp; &nbsp; &nbsp; &nbsp;陈婷婷（中国碳排放权登记结算中心登记业务部副部长）：</strong>详解CEA登记结算与履约全流程。从碳配额的注册登记、分配划拨到最终清缴履约，逐一拆解每个环节的操作规范和常见差错点，帮助企业避免因流程不熟导致的合规风险。</span></p>
<p style="text-align: center;"><span style="font-family: 方正仿宋_GB2312;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/784d4851dd4144ce909ba1c1c4929f2edz5opn10p5.png" /></span></p>
<p style="text-align: left;"><span style="font-family: 方正仿宋_GB2312;"><strong>&nbsp; &nbsp; &nbsp; &nbsp;刘亮（上海环境能源交易所首席咨询官）：</strong>现场演示<span class="wx_search_keyword_wrap">CEA交易</span>系统操作。 在真实系统环境中完整展示碳配额买卖的挂牌、竞价和成交全过程，参训学员在各自电脑上实时跟练，亲身体验交易节奏，真正做到&ldquo;学完就能用&rdquo;。</span></p>
<p style="text-align: left;"><span style="font-family: 方正仿宋_GB2312;"><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/a96d4ddf18254a3c88dcf98268b678f4ufc2vx1c9s.png" /></span></p>
<p style="text-align: left;"><span style="font-family: 方正仿宋_GB2312;"><strong>&nbsp; &nbsp; &nbsp; &nbsp; 铁浩男（北京绿色交易所全国自愿减排交易中心交易系统负责人）：</strong>主持CCER交易与抵消实操专题互动。围绕减排量评估、交易策略制定、抵消履约操作等核心问题，结合当前CCER市场实际行情，逐一解答学员提问。现场交流气氛热烈，企业带着问题来、带着方案走。</span></p>
<p style="text-align: center;"><span style="font-family: 方正仿宋_GB2312;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/704336bc9702465d9c13bd794909409de4cfug6t1a.png" /></span></p>
<p style="text-align: left;"><span style="font-family: 方正仿宋_GB2312;"><strong>&nbsp; &nbsp; &nbsp; &nbsp;范儒（SGS产品碳足迹认证中心主任）：</strong>拆解CBAM核算填报的实操要点。结合出口企业真实案例，从隐含碳排放的计算方法、数据采集规范到填报流程中的常见误区，逐一讲解并提供应对策略，为企业搭建CBAM合规应对的操作框架。</span></p>
<p style="text-align: left;"><span style="font-family: 方正仿宋_GB2312;"><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/06d9a9cdb3d441bd92eed6c87f1933f47tnkp4b1n1.png" /></span></p>
<p><strong><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; &nbsp; &nbsp;林泽若明（国浩律师济南办公室管理合伙人）：</span></strong><span style="font-family: 方正仿宋_GB2312;">梳理双碳法律合规三重防线。</span><span style="font-family: 方正仿宋_GB2312;">从碳资产确权与会计处理、碳交易合同风险条款设计、碳数据披露法律责任边界三个维度，结合实际案例给出切实可行的风险规避方案，帮助企业构建双碳合规的制度屏障。</span></p>
<p style="text-align: center;"><strong><span style="font-family: 方正仿宋_GB2312;">近百家企业齐聚，省属国企与行业龙头同堂学习</span></strong></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; &nbsp; &nbsp; 本次训练营吸引了山钢集团、山东省环保集团、山东省国投、山东发展新能源集团等省属国企的业务骨干，歌尔股份、青岛双星轮胎、天润工业等知名制造企业的能源管理负责人，以及威海银行、齐商银行、中泰证券等金融机构的绿色金融业务负责人参加。从能源管理到碳交易，从金融支持到法律合规，参训企业覆盖了绿色低碳全产业链的关键环节。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;"><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/2a3306400ace4b1889922aa63099b865q5p5vih40h.png" /></span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; &nbsp; &nbsp;&ldquo;以前听了很多政策解读，但到底怎么在系统上操作、怎么填报月度存证、怎么用CCER抵消履约，一直搞不清楚。这次一天下来，跟着讲师在模拟交易系统上操作了一遍，很多模糊的地方一下子就清晰了。&rdquo;一位来自钢铁企业的学员表示。协会后续还将组织参训学员参加&ldquo;碳排放管理员&rdquo;职业技能等级认定考试，实现&ldquo;结业即持证&rdquo;。</span></p>
<p style="text-align: center;"><strong><span style="font-family: 方正仿宋_GB2312;">&ldquo;思&mdash;研&mdash;学&mdash;评&mdash;行&rdquo;五位一体品牌矩阵加速成型</span></strong></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; &nbsp; &nbsp;本次训练营是协会</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;先行学堂&rdquo;的首期课程，也是协会构建&ldquo;五位一体&rdquo;品牌矩阵、服务山东绿色低碳高质量发展先行区建设的重要</span><span style="font-family: 方正仿宋_GB2312;">举措</span><span style="font-family: 方正仿宋_GB2312;">。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;"><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/214febe3b5d24ec895a917918c93d9febc5n3j4e45.png" /></span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; &nbsp; &nbsp;今年以来，协会围绕服务先行区建设，系统构建了</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;思&mdash;研&mdash;学&mdash;评&mdash;行&rdquo;五大品牌。思 &middot;《碳索》会刊设&ldquo;鉴、深、锋、圈、航、度、脉、声&rdquo;八大栏目，打造行业思想阵地。研 &middot;&nbsp;</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;</span><span style="font-family: 方正仿宋_GB2312;">绿动齐鲁</span><span style="font-family: 方正仿宋_GB2312;">&middot;千企行</span><span style="font-family: 方正仿宋_GB2312;">&rdquo;</span><span style="font-family: 方正仿宋_GB2312;">将走遍</span><span style="font-family: 方正仿宋_GB2312;">16地市，建立&ldquo;一企一表&rdquo;服务档案，形成首部《山东省绿色低碳产业发展年度报告》。学 &middot;&nbsp;</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;</span><span style="font-family: 方正仿宋_GB2312;">先行学堂</span><span style="font-family: 方正仿宋_GB2312;">&rdquo;</span><span style="font-family: 方正仿宋_GB2312;">定位于月度公益培训品牌，聚焦政策、技术、管理、实践四大维度，每月一课、体系赋能。评&nbsp;</span><span style="font-family: 方正仿宋_GB2312;">&middot; &ldquo;金石榜&rdquo;好产品</span><span style="font-family: 方正仿宋_GB2312;">竞赛</span><span style="font-family: 方正仿宋_GB2312;">正在积极筹备，</span><span style="font-family: 方正仿宋_GB2312;">设置</span><span style="font-family: 方正仿宋_GB2312;">7大赛道，</span><span style="font-family: 方正仿宋_GB2312;">致力打造山东绿色低碳领域最具公信力的产品</span><span style="font-family: 方正仿宋_GB2312;">竞赛</span><span style="font-family: 方正仿宋_GB2312;">。行&nbsp;</span><span style="font-family: 方正仿宋_GB2312;">&middot;&nbsp;</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;</span><span style="font-family: 方正仿宋_GB2312;">绿洽会</span><span style="font-family: 方正仿宋_GB2312;">&rdquo;</span><span style="font-family: 方正仿宋_GB2312;">计划于</span><span style="font-family: 方正仿宋_GB2312;">2026年三季度举办，定位为山东绿色低碳领域年度标志性供需对接盛会。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; &nbsp; &nbsp;五大品牌环环相扣、有机衔接：以《碳索》启迪思想，以</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;千企行&rdquo;摸清需求，以&ldquo;先行学堂&rdquo;提升能力，以&ldquo;金石榜&rdquo;树立标杆，以&ldquo;绿洽会&rdquo;促成落地。协会正加速从&ldquo;服务提供者&rdquo;向&ldquo;生态运营者&rdquo;持续跃升，为山东绿色低碳高质量发展先行区建设贡献力量</span><span style="font-family: 方正仿宋_GB2312;">。</span></p>
<p style="text-align: center;"><span style="font-family: 方正仿宋_GB2312;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/f5e2c29540c64e72b35b2804c2a8adbdnzfj2xd1fx.png" /></span></p>', '5月22日，由山东省绿色低碳产业发展协会（以下简称“协会”）主办的“先行学堂·碳路先锋”企业双碳实战训练营在济南成功举办。作为协会“ 先行学堂 ”培训品牌的首期课程，本次训练营汇聚了全国碳市场三大核心基础设施的权威专家，为来自全省钢铁、化工、能源、金融、装备制造等行业的近百名企业代表带来了一场“手把...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/01a9d35742b8454ebd72ed371349bff73rkqxalhhc.png', 'admin', 31, 0, 1, '2026-05-22 00:00:00', 1, 0, NOW(), NOW()),
  (1, '国浩济南到访 以法律合规服务护航绿色低碳发展', '<p>&nbsp; &nbsp; 4月30日，国浩律师（济南）事务所（以下简称&ldquo;<span class="wx_search_keyword_wrap">国浩济南</span>&rdquo;）管理合伙人林泽若明一行到访协会。作为协会的第三方服务机构，国浩济南在战略规划与政策咨询、法律与合规服务等领域具备深厚专业实力，双方围绕绿色低碳产业的法律保障与合规管理展开座谈交流。</p>
<p>&nbsp; &nbsp; 法律服务：绿色低碳发展的&ldquo;安全阀&rdquo;</p>
<p>&nbsp; &nbsp; 座谈会上，国浩济南重点介绍了其在绿色低碳领域的法律服务能力，涵盖企业合规体系建设、碳资产法律风险管理、绿色金融法律支持、能源项目投融资尽职调查及环境权益交易法律咨询等方面，并分享了典型服务案例。<span class="wx_search_keyword_wrap">林泽若明</span>指出，随着&ldquo;双碳&rdquo;战略深入推进，企业在碳交易、绿色融资、<span class="wx_search_keyword_wrap">ESG披露</span>等环节面临日益复杂的法律与合规挑战，专业法律服务的需求越发迫切。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/9cce533a7588472f86411395ae83c81cx05rwz91ju.png" /></p>
<p>&nbsp; &nbsp; 协会介绍了在推动绿色低碳产业发展、服务会员企业方面的工作进展。双方一致认为，法律服务是绿色低碳产业健康发展的基础保障，在企业合规体系建设、碳资产法律风险防控、绿色项目合同管理等细分领域合作空间广阔。</p>
<p>&nbsp; &nbsp; 专业赋能：从风险防控到价值创造</p>
<p>&nbsp; &nbsp; 双方一致认同，国浩济南的法律专业优势与协会的平台资源高度互补。未来，双方将在协会专家库共建、会员企业法律体检、绿色低碳政策课题联合研究、合规专题培训等方面加强协作，重点聚焦<span class="wx_search_keyword_wrap">碳交易合规</span>、绿色金融法律支撑、ESG体系建设等领域，探索法律服务创新模式。</p>
<p>&nbsp; &nbsp; 携手同行：打造绿色低碳法律服务新样板</p>
<p>&nbsp; &nbsp; 基于座谈共识，双方将建立常态化沟通机制。国浩济南将深度参与协会面向会员企业的法律服务专题活动，定期开展合规讲座、政策解读及一对一法律咨询，助力企业防范法律风险、提升合规管理水平。同时，双方将联合开展绿色低碳领域政策法规课题研究，为行业健康发展提供智力支撑。</p>
<p>&nbsp; &nbsp; 国浩济南合伙人郭彬、张灵君，资深律师赵伯龙，资深律师人张向前；协会有关部门负责人参加了座谈。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ec986b57cb8c47acab2a52daf4a108184jerlo6dah.png" /></p>', '4月30日，国浩律师（济南）事务所（以下简称“ 国浩济南 ”）管理合伙人林泽若明一行到访协会。作为协会的第三方服务机构，国浩济南在战略规划与政策咨询、法律与合规服务等领域具备深厚专业实力，双方围绕绿色低碳产业的法律保障与合规管理展开座谈交流。 法律服务：绿色低碳发展的“安全阀” 座谈会上，国浩济南重...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/9cce533a7588472f86411395ae83c81cx05rwz91ju.png', 'admin', 24, 0, 1, '2026-05-07 16:16:02', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00'),
  (1, '山东专利公司到访 共筑标准认证与知识产权新生态', '<p>&nbsp; &nbsp; 4月29日，山东专利工程有限公司（以下简称&ldquo;山东专利公司&rdquo;）执行董事兼总经理任尚军一行到访协会。作为协会的第三方服务机构，山东专利公司在标准制定、认证服务及知识产权管理等领域具备专业优势，双方围绕绿色低碳领域的协同合作展开深入交流。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/075ca805ff85497e987fc13405186cffhyn1kjmim5.png" /></p>
<p>&nbsp; &nbsp; 标准与知识产权：绿色低碳发展的重要支撑</p>
<p>&nbsp; &nbsp; 座谈会上，山东专利公司重点介绍了企业在标准体系建设、产品与体系认证、专利导航、知识产权运营及高价值专利培育等方面的技术积累与典型服务案例。任尚军指出，当前绿色低碳产业正加速向规范化、标准化方向发展，企业需要更加系统的标准支撑和知识产权保障。近年来，山东专利公司已为多家企事业单位提供全链条的知识产权与标准化服务，形成了具备复制推广能力的服务模式与技术体系。</p>
<p>&nbsp; &nbsp; 协会介绍了在推动绿色低碳产业发展、链接相关产业资源方面的工作基础。双方一致认为，标准与知识产权是推动绿色低碳产业高质量发展的重要支撑，特别是在低碳技术专利布局、绿色产品认证、<span class="wx_search_keyword_wrap">企业标准领跑者</span>培育及知识产权质押融资等领域，具备广阔的合作空间。</p>
<p>&nbsp; &nbsp; 务实合作：从资源互补到项目落地</p>
<p><span data-pm-slice="1 1 [&quot;para&quot;,{&quot;tagName&quot;:&quot;p&quot;,&quot;attributes&quot;:{},&quot;namespaceURI&quot;:&quot;http://www.w3.org/1999/xhtml&quot;}]">&nbsp; &nbsp; 协会始终致力于发挥平台纽带作用，将政策端、产业端、技术端的资源有效汇聚，为会员企业提供切实支持。此次与山东专利公司的对接，是协会在第三方服务领域布局的重要一步。</span></p>
<p>&nbsp; &nbsp; 双方一致认为，山东专利公司的专业优势与协会的平台资源高度互补。未来，将在专家库共享、联合标准研制、知识产权培训及政策课题申报等方面加强协作，重点在绿色低碳标准体系建设和知识产权保护运用领域探索服务模式创新与项目示范的可行路径。</p>
<p>&nbsp; &nbsp; 持续深化：构建常态化协作机制</p>
<p>&nbsp; &nbsp; 立足此次座谈成果，双方将建立长效沟通渠道，在绿色标准推广、知识产权专题培训、企业创新辅导等方面开展务实合作。通过定期举办专题对接活动、联合开展企业走访调研等方式，推动标准认证与知识产权服务精准触达会员企业，助力绿色低碳项目真正落地见效。</p>
<p>&nbsp; &nbsp; 山东专利公司副总经理高瑞雪、技术总监王大伟、营销部部长王琛、综合部部长刘娇，协会有关部门负责人参加了座谈。</p>
<p>&nbsp;</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ec986b57cb8c47acab2a52daf4a108184jerlo6dah.png" /></p>', '4月29日，山东专利工程有限公司（以下简称“山东专利公司”）执行董事兼总经理任尚军一行到访协会。作为协会的第三方服务机构，山东专利公司在标准制定、认证服务及知识产权管理等领域具备专业优势，双方围绕绿色低碳领域的协同合作展开深入交流。 标准与知识产权：绿色低碳发展的重要支撑 座谈会上，山东专利公司重点...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/075ca805ff85497e987fc13405186cffhyn1kjmim5.png', 'admin', 22, 0, 1, '2026-05-06 16:18:42', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00'),
  (1, '协会赴北京绿交所考察交流 共谋鲁京绿色低碳合作', '<p>&nbsp; &nbsp; 为更好地服务山东绿色低碳高质量发展先行区建设，深化山东省与北京市在碳市场、绿色技术、碳金融等领域的交流合作，4月21日，山东省绿色低碳产业发展协会秘书处赴北京绿色交易所考察交流。双方围绕<span class="wx_search_keyword_wrap">CCER项目开发</span>、绿色技术交易、碳管理人才培养、碳金融创新、碳码标识体系应用等领域深入探讨，并达成多项合作共识。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/0998ad4020c3456293c1b96855983f52da6fqp40ur.png" /></p>
<p>&nbsp; &nbsp; 深化合作共识 共谋发展新篇</p>
<p>&nbsp; &nbsp; 北京绿色交易所作为生态环境部授权的全国温室气体自愿减排交易系统运行管理机构，承担着全国绿色技术资源整合、交易撮合、评价认定和产业化推进等重要职能，是面向全球的国家级绿色交易与绿色金融基础设施平台。自2025年国家发展改革委批复以北京绿色交易所为主体设立国家绿色技术交易中心以来，其致力于打通绿色技术交易与自愿减排交易、绿色金融服务协同互补的生态闭环，不断探索完善市场导向、需求导向的绿色技术创新体系与成果转化机制。</p>
<p>&nbsp; &nbsp; 协会拥有300余家会员企业，涵盖钢铁、化工、能源、交通、环保等绿色低碳全产业链，是山东绿色低碳领域最具影响力的行业组织之一。此次考察交流，正是基于双方在碳市场服务、绿色技术转化、<span class="wx_search_keyword_wrap">碳金融创新</span>等方面的互补优势，探索鲁京两地绿色低碳协同发展的新路径。</p>
<p>&nbsp; &nbsp; 交流成果丰硕 合作空间广阔</p>
<p>&nbsp; &nbsp; 座谈会上，双方围绕六大合作方向进行了深入交流：</p>
<p>&nbsp; &nbsp; 一是在CCER项目开发与交易方面，山东是新能源大省、工业大省，在海上风电、林业碳汇、甲烷利用等领域拥有丰富的碳减排资源。截至2025年12月12日，在CCER已公示、登记的126个项目中，已有来自山东等24个省（自治区）的项目入选，预计产生年均减排量约1898.24万吨。双方表示将加强合作，共同推动山东符合条件的减排项目开发和交易，帮助山东企业更好地参与全国自愿减排市场。</p>
<p>&nbsp; &nbsp; 二是在国家绿色技术交易中心合作方面，近期北京绿色交易所已与德国史太白技术管理中国总部签约，并与河北省科学院等机构合作构建京津冀绿色技术市场联盟，在国际前沿绿色技术引进转化、绿色技术经理人培训、供需对接平台共建等领域深化合作。山东拥有丰富的绿色技术应用场景，双方可探索建立&ldquo;鲁京绿色技术供需对接通道&rdquo;。</p>
<p>&nbsp; &nbsp; 三是在碳管理人才培训方面，北京绿色交易所近期发布了全新参与人管理系统，通过覆盖能力建设及活动报名、国内外政策资讯、全球碳市场交易数据等功能的立体化服务体系，为建设参与人服务生态提供有力抓手。双方计划联合开展碳管理人才培训，为山东培养一批懂碳交易、懂碳资产管理的专业队伍。</p>
<p>&nbsp; &nbsp; 四是在碳码标识体系应用试点方面，北京绿色交易所联合中码院等机构共同研发推出了全球碳码标识体系，已在氢能行业实现&ldquo;一码溯源、贯通到底&rdquo;。山东钢铁、化工、建材等出口导向型行业对碳足迹管理需求迫切，双方将探讨在山东选取重点行业和企业开展碳码标识试点应用。</p>
<p>&nbsp; &nbsp; 五是在碳金融产品创新方面，双方围绕<span class="wx_search_keyword_wrap">碳配额质押</span>、碳回购、碳保险等碳金融合作进行了探讨，未来将进一步推动碳金融生态建设，为实体企业绿色转型提供更丰富的金融工具支持。</p>
<p>&nbsp; &nbsp; 六是在零碳园区建设方面，北京绿色交易所董事长王乃祥曾指出，&ldquo;科学算碳&rdquo;是建设零碳工厂的基础和前提，零碳工厂的建设应遵循科学算碳、源头减碳、过程脱碳、协同降碳、智能控碳、<span class="wx_search_keyword_wrap">碳抵销</span>和信息披露等六大路径。</p>
<p>&nbsp; &nbsp; 此次交流为双方深化合作奠定基础。协会将务实推动本次交流达成的成果落地，为山东绿色低碳高质量发展先行区建设注入动能，为全国碳市场建设和绿色低碳发展贡献更多山东智慧与力量。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ec986b57cb8c47acab2a52daf4a108184jerlo6dah.png" /></p>', '为更好地服务山东绿色低碳高质量发展先行区建设，深化山东省与北京市在碳市场、绿色技术、碳金融等领域的交流合作，4月21日，山东省绿色低碳产业发展协会秘书处赴北京绿色交易所考察交流。双方围绕 CCER项目开发 、绿色技术交易、碳管理人才培养、碳金融创新、碳码标识体系应用等领域深入探讨，并达成多项合作共识...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/0998ad4020c3456293c1b96855983f52da6fqp40ur.png', 'admin', 25, 0, 1, '2026-04-30 16:20:33', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00'),
  (1, '北京和碳到访 共探碳市场建设新路径', '<p>&nbsp; &nbsp; 4月24日，北京和碳环境技术有限公司（以下简称&ldquo;北京和碳&rdquo;）执行董事李石波一行到访协会，双方举行座谈交流。</p>
<p>&nbsp; &nbsp; 座谈会上，北京和碳重点介绍了企业在碳资产管理、碳核查核算、低碳技术咨询及双碳路径规划等领域的技术积累与典型项目案例。李石波指出，当前碳管理服务正加速向专业化、数字化方向升级，企业需要更加精准的政策支撑和资源对接。北京和碳近年来已为多家重点控排企业及政府部门提供全方位碳管理解决方案，形成了具备复制推广能力的服务模式与技术体系。</p>
<p><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/714813ffb86a4ef9906f49f886d3fae9mlghiz1dos.png" /></p>
<p>&nbsp; &nbsp; 此外，双方重点围绕碳市场建设领域的合作进行了深入探讨。北京和碳分享了其在碳配额分配、<span class="wx_search_keyword_wrap">碳交易策略</span>、碳资产开发及碳金融创新等方面的技术探索与实践思考。协会介绍了在推动绿色低碳产业发展、链接相关产业资源方面的工作优势。随后，双方围绕碳管理技术成果转化、细分领域标准共建及产业协同机制进行了深入交流。双方一致认为，北京和碳的技术优势与协会的平台资源高度互补，未来可在专家库共享、<span class="wx_search_keyword_wrap">联合技术</span>调研、典型项目观摩及政策课题申报等方面加强协作，并重点在碳市场建设与碳资产管理领域共同探索服务模式创新与项目示范的可行路径。</p>
<p>&nbsp; &nbsp; 下一步，双方将围绕&ldquo;技术+产业+政策&rdquo;的协同模式，在碳管理技术推广、<span class="wx_search_keyword_wrap">碳资产管理培训</span>、绿色金融对接等方面建立常态化对接机制，通过定期开展交流活动，共同探索碳管理项目及绿色低碳项目落地与模式创新的新路径。</p>
<p>&nbsp; &nbsp; 北京和碳相关负责人，协会有关部门负责人参加了座谈。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ec986b57cb8c47acab2a52daf4a108184jerlo6dah.png" /></p>', '4月24日，北京和碳环境技术有限公司（以下简称“北京和碳”）执行董事李石波一行到访协会，双方举行座谈交流。 座谈会上，北京和碳重点介绍了企业在碳资产管理、碳核查核算、低碳技术咨询及双碳路径规划等领域的技术积累与典型项目案例。李石波指出，当前碳管理服务正加速向专业化、数字化方向升级，企业需要更加精准的...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/714813ffb86a4ef9906f49f886d3fae9mlghiz1dos.png', 'admin', 19, 0, 1, '2026-04-27 16:22:07', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00'),
  (1, '服务理事单位天辰环保 双方聚焦技术与循环农业深入座谈', '<p>&nbsp; &nbsp; 4月22日，威海<span class="wx_search_keyword_wrap">天辰环保</span>股份有限公司（以下简称&ldquo;天辰环保&rdquo;）董事长宋文著一行到访协会，双方举行座谈交流。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ae3393265eb1437db8be9e482f7093a71webxjymtt.png" /></p>
<p>&nbsp; &nbsp; 座谈会上，天辰环保重点介绍了企业在工业废水处理、<span class="wx_search_keyword_wrap">VOCs治理</span>、固废资源化利用及环保设施智慧运营等领域的技术积累与典型项目案例。宋文著指出，当前环保产业正加速向智能化、系统化方向升级，企业需要更加精准的技术支撑和资源对接。天辰环保近年来已为多个化工园区、制造基地提供一体化环保解决方案，形成了具备复制推广能力的工艺包与运营体系。</p>
<p>&nbsp; &nbsp; 此外，双方重点围绕循环农业领域的合作进行了深入探讨。 天辰环保分享了其在农业有机废弃物资源化利用、种养结合、生态循环模式构建等方面的技术探索与实践思考。协会介绍了在推动农业绿色低碳发展、链接相关产业资源方面的工作基础。双方一致认为，循环农业是落实&ldquo;双碳&rdquo;战略、服务乡村振兴的重要切入点，具备广阔的合作空间。</p>
<p>&nbsp; &nbsp; 协会始终致力于发挥平台纽带作用，将政策端、产业端、技术端的资源有效汇聚，为会员单位提供切实支持。近期，在天辰环保组织面试期间，协会积极践行服务承诺，无偿提供场地及会务支持，以实际行动为理事单位提供精准服务。</p>
<p>&nbsp; &nbsp; 随后，双方围绕环保技术成果转化、细分领域标准共建及产业协同机制进行了深入交流。双方一致认为，天辰环保的技术优势与协会的平台资源高度互补，未来可在专家库共享、<span class="wx_search_keyword_wrap">联合技术</span>调研、典型项目观摩及政策课题申报等方面加强协作，并重点在循环农业领域共同探索技术集成与项目示范的可行路径。</p>
<p>&nbsp; &nbsp; 下一步，双方将围绕&ldquo;技术+产业+政策&rdquo;的协同模式，在环保技术推广、<span class="wx_search_keyword_wrap">碳资产管理培训</span>、绿色金融对接等方面建立常态化对接机制，通过定期开展交流活动，共同探索环保项目及循环农业项目落地与模式创新的新路径。</p>
<p>&nbsp; &nbsp; 天辰环保技术骨干，协会有关部门负责人参加了座谈。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ec986b57cb8c47acab2a52daf4a108184jerlo6dah.png" /></p>', '4月22日，威海 天辰环保 股份有限公司（以下简称“天辰环保”）董事长宋文著一行到访协会，双方举行座谈交流。 座谈会上，天辰环保重点介绍了企业在工业废水处理、 VOCs治理 、固废资源化利用及环保设施智慧运营等领域的技术积累与典型项目案例。宋文著指出，当前环保产业正加速向智能化、系统化方向升级，企业...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ae3393265eb1437db8be9e482f7093a71webxjymtt.png', 'admin', 15, 0, 1, '2026-04-23 16:23:44', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00'),
  (1, '绿色步履丈量春日 低碳理念“撞”进灵岩', '<p>&nbsp; &nbsp; 一场健步走，走出了团队活力，更走出了协会与千年古刹的&ldquo;绿&rdquo;缘</p>
<p>&nbsp; &nbsp; 春风和煦，万物竞发。4月10日，山东省绿色低碳产业发展协会秘书处全体工作人员走进千年古刹<span class="wx_search_keyword_wrap">灵岩寺</span>景区，开展了一场别开生面的健步走活动。原本只是一次寻常的团队建设，却因为一次&ldquo;意外邂逅&rdquo;，为这个春天增添了一抹不寻常的绿色。</p>
<p>&nbsp; &nbsp; 古柏参天间，走出一支&ldquo;绿色队伍&rdquo;</p>
<p>&nbsp; &nbsp; 上午十点，秘书处全员精神抖擞地齐聚灵岩寺景区入口。大家执起印有协会名称的会旗，在古刹山门前留下了一张朝气蓬勃的合影。随后，队伍沿着蜿蜒的景区步道，正式开启了这场&ldquo;用脚步丈量春天&rdquo;的健步走之旅。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/58a6424af145489291425befe13ffd92jqaz6fu4nr.png" /></p>
<p>&nbsp; &nbsp; 灵岩寺内古柏参天，春光明媚，空气中弥漫着草木清香，路边的小猫舒展着身体伸着懒腰。一路上，大家一边欣赏沿途风景，一边交流工作心得&mdash;&mdash;从绿色低碳产业发展的前沿动态，到协会在推动全省绿色转型中的职责使命，话题在步履间自由流淌，气氛轻松而热烈。</p>
<p>&nbsp; &nbsp; &ldquo;走出来&rdquo;的不只是身体，更是思路和凝聚力。不少同事表示，置身于这样一座历史悠久、自然景观优越的景区，更能真切体会到绿色低碳理念与美好生活的内在关联。</p>
<p>&nbsp; &nbsp; 从产业到文旅，绿色理念正在&ldquo;破壁&rdquo;</p>
<p>&nbsp; &nbsp; 活动的亮点，发生在一个不经意的瞬间。</p>
<p>&nbsp; &nbsp; 行进途中，灵岩寺景区的工作人员注意到了这支高举旗帜、步伐整齐的队伍。</p>
<p>&nbsp; &nbsp; 在得知协会长期致力于推动各行各业及公众领域的绿色低碳转型后，景区工作人员当场表达了高度赞许，并表示希望能在即将到来的&ldquo;五一&rdquo;假期及后续适当时间段，与协会共同开展绿色低碳主题的公益宣传与互动活动。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/f4bb3ac4114e4ecd82cd13f70f5dc0a16sdui3kwc6.png" /></p>
<p>&nbsp; &nbsp; &ldquo;我们景区每天接待大量游客，如果能引入绿色低碳的理念宣传，引导大家做到&lsquo;无痕游览&rsquo;，那就太好了。&rdquo;景区工作人员说道。</p>
<p>&nbsp; &nbsp; 协会秘书处相关负责人表示，绿色低碳理念正在被越来越多的社会主体所关注和接纳。协会将推动绿色低碳理念融入全省经济社会发展的更多&ldquo;毛细血管&rdquo;。</p>
<p>&nbsp; &nbsp; 关注我们，一起见证更多&ldquo;绿色故事&rdquo;诞生。</p>', '一场健步走，走出了团队活力，更走出了协会与千年古刹的“绿”缘 春风和煦，万物竞发。4月10日，山东省绿色低碳产业发展协会秘书处全体工作人员走进千年古刹 灵岩寺 景区，开展了一场别开生面的健步走活动。原本只是一次寻常的团队建设，却因为一次“意外邂逅”，为这个春天增添了一抹不寻常的绿色。 古柏参天间，走...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/58a6424af145489291425befe13ffd92jqaz6fu4nr.png', 'admin', 17, 0, 1, '2026-04-22 16:27:11', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00'),
  (1, '聚焦央行碳减排支持工具新规，金融顾问刘莹作专题解读', '<p>&nbsp; &nbsp; 4月13日上午，协会开展&ldquo;每周一学&rdquo;专项活动。本次活动由协会金融顾问、绿色金融专业委员会秘书长刘莹主讲，主题为&ldquo;中国人民银行最新<span class="wx_search_keyword_wrap">碳减排支持工具</span>管理要求解读&rdquo;。秘书处全体成员参加。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/238708d6008c44b79419bce5936a16ff5yp716pz25.png" /></p>
<p>&nbsp; &nbsp; 2026年1月，中国人民银行发布《关于优化碳减排支持工具管理有关事宜的通知》，对碳减排支持工具的支持领域、操作流程、管理要求等进行了重大调整。刘莹结合政策原文及行业分析，从政策演进、核心变化、行业影响及未来展望四个维度，对新规进行了系统深入的解读，重点分析了支持领域扩围、操作机制优化、银行范围调整等关键变化及其对绿色金融发展的影响。</p>
<p>&nbsp; &nbsp; 与会人员围绕新规下会员单位的融资机遇、绿色项目认定标准等议题展开讨论。大家表示，通过此次学习，进一步加深了对央行绿色金融政策的理解，将为后续服务会员单位提供更有力的专业支撑。</p>
<p>&nbsp; &nbsp; 未来，协会将持续以&ldquo;每周一学&rdquo;为载体，持续聚焦绿色低碳前沿政策与产业动态，不断提升秘书处专业化服务能力。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ec986b57cb8c47acab2a52daf4a108184jerlo6dah.png" /></p>', '4月13日上午，协会开展“每周一学”专项活动。本次活动由协会金融顾问、绿色金融专业委员会秘书长刘莹主讲，主题为“中国人民银行最新 碳减排支持工具 管理要求解读”。秘书处全体成员参加。 2026年1月，中国人民银行发布《关于优化碳减排支持工具管理有关事宜的通知》，对碳减排支持工具的支持领域、操作流程、...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/238708d6008c44b79419bce5936a16ff5yp716pz25.png', 'admin', 19, 0, 1, '2026-04-16 16:30:17', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00'),
  (1, '山东节能协会到访 共商节能降碳新路径', '<p>&nbsp; &nbsp; 4月15日上午，山东节能协会公共机构节能专委会秘书长潘国锋一行到访协会，双方举行座谈交流。</p>
<p>&nbsp; &nbsp; 座谈会上，潘国锋重点分享了公共机构节能专委会在推动政府机关、学校、医院等公共机构节能改造、<span class="wx_search_keyword_wrap">能源托管</span>及合同能源管理等方面的实践经验与典型案例。他指出，公共机构体量大、覆盖广，是节能降碳的重要阵地。专委会近年来已累计服务上百家公共机构，形成了一批可复制、可推广的示范项目。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/654a57e754f5430c8c3a3d27783f997dyafhcpfplv.png" /></p>
<p>&nbsp; &nbsp; 协会介绍了自成立以来在链接产业资源、服务会员企业、推动绿色项目落地等方面取得的积极进展。协会始终致力于发挥平台纽带作用，将政策端、产业端、技术端的资源有效汇聚，为会员企业提供切实支持。</p>
<p>随后，双方聚焦专委会赋能行业发展的实践路径，围绕组织架构、运行机制及未来规划进行了全方位交流。双方一致认为，专委会是协会延伸服务触角、深耕细分领域的重要抓手，未来可在专家库共建、联合调研、标准制定等方面加强协作。</p>
<p>&nbsp; &nbsp; 下一步，双方将围绕&ldquo;节能服务+产业资源+政策支撑&rdquo;的协同模式，在节能技术推广、碳资产管理培训、联合课题研究等方面建立常态化对接机制，通过定期开展交流活动，共同探索节能降碳项目落地的新路径，为山东省绿色低碳高质量发展先行区建设贡献协会力量。</p>
<p>&nbsp; &nbsp; 山东节能协会公共机构节能专委会副秘书长、山东浪潮智慧建筑科技有限公司生态合作部总监刘小慧，专委会副秘书长、山东美好环境科技有限公司总经理杜建明，山东恒源弘能源科技有限公司副总经理殷晨，同圆设计集团建筑与工业节能研究所所长孙彦松，中建八局二公司双碳研究院院长章明友，山东正亨新能源科技有限公司总经理柴培华，国盛证券能源投资部总监李金超，<span class="wx_search_keyword_wrap">烟台众德环保设备科技有限公司</span>区域经理胡少康，北京新兴合众科技有限公司区域经理李宁等会员单位代表参加了座谈。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ec986b57cb8c47acab2a52daf4a108184jerlo6dah.png" /></p>', '4月15日上午，山东节能协会公共机构节能专委会秘书长潘国锋一行到访协会，双方举行座谈交流。 座谈会上，潘国锋重点分享了公共机构节能专委会在推动政府机关、学校、医院等公共机构节能改造、 能源托管 及合同能源管理等方面的实践经验与典型案例。他指出，公共机构体量大、覆盖广，是节能降碳的重要阵地。专委会近年...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/654a57e754f5430c8c3a3d27783f997dyafhcpfplv.png', 'admin', 20, 0, 1, '2026-04-16 16:29:06', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00'),
  (1, '绿色金融赋能产业转型！这场座谈会共探产融合作新路径', '<p>&nbsp; &nbsp; 4月2日上午，协会会员单位、绿色金融专业委员会常务理事单位&mdash;&mdash;兴业银行济南分行（以下简称&ldquo;兴业银行&rdquo;）绿色金融部绿色金融科科长矫晓林一行到访协会秘书处座谈交流。会议由协会会员服务部部长荀泽堃主持，兴业银行绿色金融部绿色金融产品经理李鹏芳参加。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/dcba802b2dfa43be8d9abf2780ccdff6yojmmpyv1l.png" /></p>
<section>&nbsp; &nbsp; 荀泽堃对矫晓林一行的到来表示欢迎。他表示，<span data-pm-slice="1 1 [&quot;para&quot;,{&quot;tagName&quot;:&quot;section&quot;,&quot;attributes&quot;:{&quot;style&quot;:&quot;text-align: left;text-indent: 2em;margin-top: 8px;&quot;},&quot;namespaceURI&quot;:&quot;http://www.w3.org/1999/xhtml&quot;}]">兴业银行长期深耕绿色金融，近年来持续加大在山东的绿色金融服务力度。</span>希望借助兴业银行在绿色金融领域的专业优势，为会员企业提供更加精准、多元的金融支持。</section>
<section>&nbsp; &nbsp; 矫晓林介绍了兴业银行在绿色信贷、碳金融、ESG投融资等领域的创新实践。他表示，作为协会绿色金融专业委员会的常务理事单位，兴业银行希望依托协会的行业资源与专业平台，进一步打通绿色金融与实体产业的对接通道，助力更多绿色低碳项目落地见效。</section>
<section>&nbsp; &nbsp; 荀泽堃围绕协会会员企业在绿色转型过程中面临的融资痛点，与兴业银行代表进行了深入交流。双方在绿色项目识别、企业碳资产管理以及<span class="wx_search_keyword_wrap">CCER</span>（国家核证自愿减排量）项目开发与交易合作等方面达成了多项共识。</section>
<section>&nbsp; &nbsp; 此次座谈是协会推动&ldquo;金融+产业&rdquo;深度融合的具体实践。下一步，协会将持续发挥&ldquo;政策翻译官&rdquo;和&ldquo;企业联络员&rdquo;的作用，携手兴业银行等绿色金融机构，推动更多金融资源精准流向绿色低碳领域，为山东绿色低碳高质量发展注入更强金融动能。</section>
<section><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ec986b57cb8c47acab2a52daf4a108184jerlo6dah.png" /></section>', '4月2日上午，协会会员单位、绿色金融专业委员会常务理事单位——兴业银行济南分行（以下简称“兴业银行”）绿色金融部绿色金融科科长矫晓林一行到访协会秘书处座谈交流。会议由协会会员服务部部长荀泽堃主持，兴业银行绿色金融部绿色金融产品经理李鹏芳参加。 荀泽堃对矫晓林一行的到来表示欢迎。他表示， 兴业银行长期...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/dcba802b2dfa43be8d9abf2780ccdff6yojmmpyv1l.png', 'admin', 17, 0, 1, '2026-04-02 16:33:15', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00'),
  (1, '“每周一学”进行时，秘书处持续深化专业能力建设', '<p>&nbsp; &nbsp; 为持续提升秘书处团队的专业素养与综合能力，山东省绿色低碳产业发展协会秘书处持续开展&ldquo;每周一学&rdquo;专项活动。活动由各部门负责人轮流主讲，秘书处全体成员参加。过去三周，三位主讲人分别围绕碳排放标准体系、水污染治理技术、协会党建工作三个主题进行了系统分享，取得了良好成效。</p>
<p>&nbsp; &nbsp; 厘清概念 夯实基础 深度解析碳排放与碳足迹标准</p>
<p>&nbsp; &nbsp; 3月16日，&ldquo;每周一学&rdquo;专项活动由外联活动部主讲。本次专题学习以&ldquo;碳排放与碳足迹的核心概念及标准体系&rdquo;为主题，系统梳理了碳领域的核心概念与市场机制。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/a0f7e1fa35434e409bfed10e7d045e70fo68nwjzsx.png" /></p>
<p>&nbsp; &nbsp; 主讲人首先从定义出发，明确区分了&ldquo;<span class="wx_search_keyword_wrap">碳信用</span>&rdquo;与&ldquo;碳抵消&rdquo;的本质差异。随后，深度剖析了ISO14064标准中<span class="wx_search_keyword_wrap">Scope1</span>（直接排放）、Scope2（能源间接排放）和Scope3（其他间接排放）的核算边界，特别强调了供应链、员工差旅等易被忽视的Scope3排放源，为与会人员构建了清晰的组织碳账本框架。在此基础上，重点对绿电、绿证、CCER（国家核证自愿减排量）和<span class="wx_search_keyword_wrap">CEA</span>（全国碳排放权配额）四大关键市场机制进行了多维度对比分析。</p>
<p>&nbsp; &nbsp; 本次专题学习逻辑严密、内容详实。与会人员围绕&ldquo;如何利用绿证优化Scope2排放数据&rdquo;&ldquo;CCER重启后的项目开发机遇&rdquo;及&ldquo;产品碳足迹核算的难点突破&rdquo;等议题展开热烈讨论，现场交流氛围浓厚。</p>
<p>&nbsp; &nbsp; 守护生命之源 共探水处理之道</p>
<p>&nbsp; &nbsp; 3月23日，&ldquo;每周一学&rdquo;专项活动由技术推广部主讲。本次学习以&ldquo;水污染与常用水处理流程&rdquo;为主题，围绕水污染现状、水质标准、污水与自来水处理工艺，以及<span class="wx_search_keyword_wrap">微塑料去除</span>等热点问题展开系统讲解。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/d42f720795b8459ead1b1889e4d76237qlm8btbw2r.png" /></p>
<p>&nbsp; &nbsp; 主讲人结合《水污染防治法》与《生活饮用水卫生标准》等政策文件，深入浅出地介绍了从格栅、<span class="wx_search_keyword_wrap">沉砂池</span>到活性污泥法、膜分离技术等常用水处理流程，并重点分享了当前广受关注的微塑料污染及其在水厂、污水厂中的去除机制。讲解内容既有理论深度，又贴近实际应用，现场气氛热烈。</p>
<p>&nbsp; &nbsp; 与会人员纷纷表示，此次学习进一步加深了对水资源保护与水处理技术的理解，也对日常生活中节约用水、减少塑料污染的重要性有了更深刻的认识。</p>
<p>&nbsp; &nbsp; 党建引领聚合力&nbsp;<span data-pm-slice="1 1 [&quot;para&quot;,{&quot;tagName&quot;:&quot;p&quot;,&quot;attributes&quot;:{&quot;style&quot;:&quot;text-indent: 2em; margin-top: 8px;&quot;},&quot;namespaceURI&quot;:&quot;http://www.w3.org/1999/xhtml&quot;}]">党建工作怎么干</span></p>
<p>&nbsp; &nbsp; 3月30日，&ldquo;每周一学&rdquo;专项活动由综合工作部主讲。本次学习以&ldquo;党支部来了&mdash;&mdash;党建工作怎么干&rdquo;为主题，围绕成立协会党支部的必要性、建设路线图以及每位成员的角色定位等内容展开深入交流。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/61975a8bd1d74d249df0fbd587b7945b8h349gq68n.png" /></p>
<p>&nbsp; &nbsp; 主讲人从政策层面、协会层面和团队层面三个维度，阐释了党建工作对社会组织规范化建设、提升公信力以及凝聚团队力量的重要意义。随后，系统介绍了党支部建设&ldquo;三步走&rdquo;路线图，涵盖筹备、成立到常态化运行的关键节点，并明确了&ldquo;三会一课&rdquo;、主题党日等重点工作内容。讲解条理清晰、案例生动，现场气氛积极热烈。</p>
<p>&nbsp; &nbsp; 与会人员表示，此次学习让大家对党建工作有了更直观、更深刻的认识，进一步增强了参与协会党建工作的责任感和主动性。大家纷纷表示将积极支持筹备工作，推动协会党支部早日落地生根，为协会高质量发展注入&ldquo;红色动能&rdquo;。</p>
<p>&nbsp; &nbsp; 从双碳标准到水处理技术，再到党建引领，协会秘书处将&ldquo;每周一学&rdquo;落到实处，持续深化专业能力建设。未来，协会将继续以&ldquo;每周一学&rdquo;专项活动为载体，深刻聚焦绿色低碳前沿议题，持续推动学习成果转化为工作实效，不断提升秘书处专业化、规范化水平，奋力谱写山东绿色低碳发展的新篇章。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ec986b57cb8c47acab2a52daf4a108184jerlo6dah.png" /></p>', '为持续提升秘书处团队的专业素养与综合能力，山东省绿色低碳产业发展协会秘书处持续开展“每周一学”专项活动。活动由各部门负责人轮流主讲，秘书处全体成员参加。过去三周，三位主讲人分别围绕碳排放标准体系、水污染治理技术、协会党建工作三个主题进行了系统分享，取得了良好成效。 厘清概念 夯实基础 深度解析碳排放...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/a0f7e1fa35434e409bfed10e7d045e70fo68nwjzsx.png', 'admin', 21, 0, 1, '2026-03-30 16:39:57', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00'),
  (1, '2026第五届黄河流域新能源创新发展大会召开', '<p><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/2ab227354b564ff8a3db8147e26947daeg8cywqebm.png" /></p>
<section><span style="font-family: 仿宋_GB2312;">&nbsp; &nbsp; 3月</span><span style="font-family: 仿宋_GB2312;">10</span><span style="font-family: 仿宋_GB2312;">日，</span><span style="font-family: 仿宋_GB2312;">202</span><span style="font-family: 仿宋_GB2312;">6</span><span style="font-family: 仿宋_GB2312;">第</span><span style="font-family: 仿宋_GB2312;">五</span><span style="font-family: 仿宋_GB2312;">届黄河流域新能源创新发展大会</span><span style="font-family: 仿宋_GB2312;">在济南召开，山东省绿色低碳产业发展协会（以下简称&ldquo;协会&rdquo;）作为协办单位，携会员单位出席会议</span><span style="font-family: 仿宋_GB2312;">。</span></section>
<p><span style="font-family: 仿宋_GB2312;">&nbsp; &nbsp; </span>大会以&ldquo;绿能焕新黄河岸，协同共创<span class="wx_search_keyword_wrap">零碳圈</span>&rdquo;为主题，汇聚国内外院士专家、政企及科研院所代表500余人，搭建高端交流合作平台，为黄河流域新能源创新发展与生态保护协同推进注入强劲动力，助力我国&ldquo;双碳&rdquo;目标落地。</p>
<p><span style="font-family: 仿宋_GB2312;">&nbsp; &nbsp; </span>会上，山东省人大常委会党组副书记、副主任白玉刚，山东省国有资产投资控股有限公司党委书记、董事长栾健，生态环境部黄河生态环境科学研究所副所长黄文海，中国生产力促进中心协会理事长申长江分别致辞，一致强调新能源产业是推动黄河流域生态保护和高质量发展的重要支撑，希望通过大会凝聚多方力量，共促产业升级。</p>
<p><span style="font-family: 仿宋_GB2312;">&nbsp; &nbsp; </span>主旨演讲环节，十余位知名专家学者及业界代表分享前沿观点与实践经验。山东省科协主席凌文围绕可持续发展与能源电力发展趋势，结合全球气候治理与我国&ldquo;双碳&rdquo;目标，阐述能源电力转型关键举措，并提出&ldquo;数-算-能-网&rdquo;协同发展模式，为流域能源转型提供科学指引。</p>
<p><span style="font-family: 仿宋_GB2312;">&nbsp; &nbsp; </span>随后，<span class="wx_search_keyword_wrap">崂山国家实验室</span>领军科学家唐波、日本工程院外籍院士陈飞勇、欧洲科学院院士赵旭东、欧洲自然科学院院士刘洪正等专家，分享光电制氢产业化、大宗固废高值化利用、能源革命与科技创新路径等领域研究成果；山东省工程师协会副会长张怀涛、中信重工相关负责人王华亭等业界代表，则结合企业实践，分享循环经济发展、新能源材料研发等经验，为产业发展提供实操参考。</p>
<p><span style="font-family: 仿宋_GB2312;">&nbsp; &nbsp; </span>能源企业出海专题环节，济南市商务局一级调研员徐运坤解读外贸形势及相关政策，多位嘉宾围绕出海品牌建设、东盟市场投资、新能源出海策略等分享见解，为山东新能源企业拓宽国际赛道提供支持。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/8b7efe02dce34c6cbe3dcc64d950715elpzhi3n45f.png" /></p>
<p><span data-pm-slice="0 0 []"><span style="font-family: 仿宋_GB2312;">&nbsp; &nbsp; </span>本次大会是落实黄河重大国家战略的具体举措，协会理事单位新丞华国际会展（山东）集团有限公司作为承办单位之一，为大会的成功举办付出了辛勤努力，展现了协会成员的专业风采和责任担当。未来，协会将继续携手广大会员，围绕黄河流域生态保护和高质量发展要求，推动新能源技术创新与产业升级，为打造区域零碳发展新格局贡献智慧和力量。</span></p>
<p style="text-align: center;"><span data-pm-slice="0 0 []"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ec986b57cb8c47acab2a52daf4a108184jerlo6dah.png" /></span></p>', '3月 10 日， 202 6 第 五 届黄河流域新能源创新发展大会 在济南召开，山东省绿色低碳产业发展协会（以下简称“协会”）作为协办单位，携会员单位出席会议 。 大会以“绿能焕新黄河岸，协同共创 零碳圈 ”为主题，汇聚国内外院士专家、政企及科研院所代表500余人，搭建高端交流合作平台，为黄河流域新...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/2ab227354b564ff8a3db8147e26947daeg8cywqebm.png', 'admin', 21, 0, 1, '2026-03-10 16:43:43', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00'),
  (1, '钢铁降碳路径深度解析 | 协会“每周一学”干货满满', '<section><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/4911d34a200b4e8b8c91a7e1fa53f621gf292i1x5y.png" /></section>
<section>&nbsp; &nbsp; 2026年3月9日，山东省绿色低碳产业发展协会秘书处开展&ldquo;每周一学&rdquo;专项活动。本次学习由会员服务部负责人荀泽堃担任主讲，协会秘书处成员参与学习。</section>
<section>&nbsp; &nbsp; 荀泽堃围绕钢铁行业《企业温室气体排放核算与报告指南》展开解读，系统梳理了2025年全国<span class="wx_search_keyword_wrap">排放权交易市场</span>钢铁行业工作安排，他从企业层级与工序层级两个维度，精准剖析了<span class="wx_search_keyword_wrap">碳排放核算</span>的关键要点，并结合实际案例，生动对比了炼钢工序中的碳排放与减排效果差异。在此基础上，他还提出了钢铁行业短、中、长期的降碳路径建议，为与会人员提供了清晰的实践思路。</section>
<section>&nbsp; &nbsp; 本次分享主题明确，内容丰富，<span data-pm-slice="0 0 []">与会人员围绕&ldquo;短期降碳措施的可行性与落地路径&rdquo;展开了热烈讨论，现场交流氛围浓厚，思想碰撞频频。未来，协会将继续以&ldquo;每周一学&rdquo;活动为载体，聚焦绿色低碳前沿议题，持续提升秘书处专业素养与服务能力。</span></section>
<section><span data-pm-slice="0 0 []"><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ec986b57cb8c47acab2a52daf4a108184jerlo6dah.png" /></span></section>', '2026年3月9日，山东省绿色低碳产业发展协会秘书处开展“每周一学”专项活动。本次学习由会员服务部负责人荀泽堃担任主讲，协会秘书处成员参与学习。 荀泽堃围绕钢铁行业《企业温室气体排放核算与报告指南》展开解读，系统梳理了2025年全国 排放权交易市场 钢铁行业工作安排，他从企业层级与工序层级两个维度，...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/4911d34a200b4e8b8c91a7e1fa53f621gf292i1x5y.png', 'admin', 22, 0, 1, '2026-03-09 16:46:12', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00'),
  (1, '协会开展团体标准立项审查会', '<section>&nbsp; &nbsp;<img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/6d2d0dbfb81047b590822c35c25e81175repo0ubge.png" /></section>
<section>&nbsp; &nbsp; 2026年3月6日下午，山东省绿色低碳产业发展协会（以下简称&ldquo;协会&rdquo;）在山东省产品质量检验研究院开展《有色金属（铅）再生利用企业节能降碳减排量化评估技术规范》团体标准立项审查会。</section>
<section>&nbsp; &nbsp; 本次立项审查会邀请了协会标准化专业委员会（以下简称&ldquo;专委会&rdquo;）的7位专家，盟浪可持续数字科技（深圳）有限责任公司代表简要汇报了项目背景、标准框架与内容，<span data-pm-slice="0 0 []">并现场回应专家提问。专家结合各自领域，提出数条研讨意见。</span></section>
<section>&nbsp; &nbsp; 经过充分研讨与质询，会议审查组认为该标准可为再生铅碳减排核算提供依据，一致同意该标准顺利通过立项审查。本次立项审查会既是对上午专委会成立大会的积极响应，也是专委会成立后开展的一项实质性工作。下一步，协会将依托专委会，指导标准起草组完善标准内容，推动其早日发布实施，为全省再生铅产业高质量发展和低碳转型提供有力支撑。</section>
<section><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ec986b57cb8c47acab2a52daf4a108184jerlo6dah.png" /></section>', '2026年3月6日下午，山东省绿色低碳产业发展协会（以下简称“协会”）在山东省产品质量检验研究院开展《有色金属（铅）再生利用企业节能降碳减排量化评估技术规范》团体标准立项审查会。 本次立项审查会邀请了协会标准化专业委员会（以下简称“专委会”）的7位专家，盟浪可持续数字科技（深圳）有限责任公司代表简要...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/6d2d0dbfb81047b590822c35c25e81175repo0ubge.png', 'admin', 23, 0, 1, '2026-03-06 16:50:13', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00'),
  (1, '“超碳一号”产业化论证评估会在济召开', '<p style="text-align: center;">&mdash;&mdash;专家一致认定超临界二氧化碳工质高效发电技术产业化</p>
<p style="text-align: center;">在多领域具备很高的推广价值，前景广阔。</p>
<p>&nbsp; &nbsp; 2026年1月10日，受省委、省政府点题推动，由山东省绿色低碳产业发展协会组织、山钢集团牵头实施的&ldquo;超碳一号&rdquo;超临界二氧化碳高效工质发电技术产业化论证评估会，在济南顺利召开。本次会议旨在科学评估该项全球首套商业化运行前沿技术的先进性、可靠性及产业化可行性，为我省乃至全国布局推广该技术、培育能源装备新质生产力提供决策依据。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/9bcf95e28129495791f2521fbb6547d32l20h0nmbi.png" /></p>
<p style="text-align: center;">山钢集团党委常委、副总经理 王向东</p>
<p>&nbsp; &nbsp; 山钢集团党委常委、副总经理王向东主持会议并致辞。他指出，此次论证会是贯彻落实省委、省政府决策部署、推动钢铁行业绿色转型的关键举措，也是对&ldquo;超碳一号&rdquo;从技术成功走向市场成功的一次重要检验。王向东强调，评估工作要坚持&ldquo;真评真说、实评实说&rdquo;，聚焦技术核心、产业实际与长远生态，为技术优化与推广落地提供坚实支撑。</p>
<p>&nbsp; &nbsp; 会议邀请了来自国内能源动力、工程热物理、电力系统等领域的权威专家组成论证评估组。专家组听取了项目研制单位济钢国际的系统汇报，并围绕技术经济性、系统稳定性、标准建设、产业化路径等开展了深入问询与讨论。</p>
<p>&nbsp; &nbsp; 专家组一致认为，&ldquo;超碳一号&rdquo;技术是我国在能源与工业余热利用领域的一项革命性创新，成功实现了发电工质的根本性变革。该技术依托济钢国际的工艺集成与工程化能力，建成了国际领先的示范工程。专家形成明确结论：&ldquo;超临界二氧化碳工质高效发电技术产业化在多领域具备很高的推广价值，前景广阔。&rdquo; 该技术为钢铁、有色、建材、化工等高耗能行业实现余热高效回收与低碳转型提供了重要的技术路径和工程范例，具备显著的行业引领与战略示范价值。</p>
<p>&nbsp; &nbsp; 与会专家充分肯定了技术路线的科学性与核心设备成熟度，同时从产业化推广角度，对系统经济性核算、运行稳定性、标准规范、成本控制等方面提出了建设性意见。专家建议，下一步应加快建立全流程标准体系，开展多场景差异化示范，深化数据驱动与技术创新，推动技术从&ldquo;首台套&rdquo;向&ldquo;可复制、可推广、可盈利&rdquo;的成熟产业阶段迈进。</p>
<p>&nbsp; &nbsp; 此次论证评估会的成功召开，标志着&ldquo;超碳一号&rdquo;技术获得了权威认可，其产业化路径进一步清晰。协会将继续发挥平台纽带作用，协同山钢集团、济钢国际及相关单位，认真落实专家意见，加快技术优化与生态构建，推动该技术在山东省率先形成示范应用和产业集群，为全省绿色低碳高质量发展注入强劲科技动能，为国家&ldquo;双碳&rdquo;战略实施贡献山东力量。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ec986b57cb8c47acab2a52daf4a108184jerlo6dah.png" /></p>', '——专家一致认定超临界二氧化碳工质高效发电技术产业化 在多领域具备很高的推广价值，前景广阔。 2026年1月10日，受省委、省政府点题推动，由山东省绿色低碳产业发展协会组织、山钢集团牵头实施的“超碳一号”超临界二氧化碳高效工质发电技术产业化论证评估会，在济南顺利召开。本次会议旨在科学评估该项全球首套...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/9bcf95e28129495791f2521fbb6547d32l20h0nmbi.png', 'admin', 21, 0, 1, '2026-01-12 16:52:11', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00'),
  (1, '秘书处专题学习碳市场的前世今生', '<section><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/554a26a1686f477e9e06577b0d735fb1fmoxxabowk.png" /></section>
<section>&nbsp; &nbsp; 2026年1月4日上午，山东省绿色低碳产业发展协会秘书处开展&ldquo;每周一学&rdquo;专项活动。本次学习由协会政策研究部负责人侯鹏飞担任主讲，协会秘书处成员参与学习。</section>
<section>&nbsp; &nbsp; 侯鹏飞围绕碳市场发展历程、现状与展望展开详细分享，详细讲解了碳市场成立的相关气候环境与政策背景、系统梳理了国际碳市场发展历程和国内碳市场现状与制度框架，并补充分享了碳市场对企业绿色转型的驱动作用和自愿减排市场与多元化碳金融产品，为协会提供更优质的会员服务提供了有力支撑。</section>
<section>&nbsp; &nbsp; 本次分享内容详实、脉络清晰，为秘书处成员带来了一堂生动的碳市场&ldquo;入门课&rdquo;。大家表示，将以此次学习为契机，对碳市场进行深入研究，在提高个人专业能力的同时，不断积累服务会员企业的知识储备与实践智慧，助力会员企业实现绿色低碳高质量发展。</section>
<section><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ec986b57cb8c47acab2a52daf4a108184jerlo6dah.png" /></section>', '2026年1月4日上午，山东省绿色低碳产业发展协会秘书处开展“每周一学”专项活动。本次学习由协会政策研究部负责人侯鹏飞担任主讲，协会秘书处成员参与学习。 侯鹏飞围绕碳市场发展历程、现状与展望展开详细分享，详细讲解了碳市场成立的相关气候环境与政策背景、系统梳理了国际碳市场发展历程和国内碳市场现状与制度...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/554a26a1686f477e9e06577b0d735fb1fmoxxabowk.png', 'admin', 25, 0, 1, '2026-01-04 16:54:06', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00'),
  (1, '秘书处开展新能源消纳调控指导意见专题学习', '<p><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/77659f10b1594c0bbaccbbb01c2c32ffysfz496vzo.png" /></p>
<p data-pm-slice="0 0 []">&nbsp; &nbsp; 12月29日上午，山东省绿色低碳产业发展协会秘书处开展&ldquo;每周一学&rdquo;专项活动。本次学习由协会会长单位&mdash;&mdash;山钢集团驻会专家赵新华主讲，围绕《<span data-pm-slice="1 1 [&quot;para&quot;,{&quot;tagName&quot;:&quot;p&quot;,&quot;attributes&quot;:{&quot;data-pm-slice&quot;:&quot;0 0 []&quot;,&quot;style&quot;:&quot;-webkit-tap-highlight-color: transparent; margin: 8px 0px 0px; padding: 0px; outline: 0px; max-width: 100%; box-sizing: border-box !important; overflow-wrap: break-word !important; clear: both; min-height: 1em; color: rgba(0, 0, 0, 0.9); font-family: \\&quot;PingFang SC\\&quot;, system-ui, -apple-system, BlinkMacSystemFont, \\&quot;Helvetica Neue\\&quot;, \\&quot;Hiragino Sans GB\\&quot;, \\&quot;Microsoft YaHei UI\\&quot;, \\&quot;Microsoft YaHei\\&quot;, Arial, sans-serif; font-size: 17px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: 0.544px; orphans: 2; text-align: justify; text-transform: none; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; white-space: normal; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial; background-color: rgb(255, 255, 255); text-indent: 2em; visibility: visible;&quot;},&quot;namespaceURI&quot;:&quot;http://www.w3.org/1999/xhtml&quot;}]">关于促进新能源消纳和调控的指导意见</span>》(发改能源〔2025〕1360号，以下简称《意见》)展开政策解读，协会秘书处成员参与学习。</p>
<p>&nbsp; &nbsp; 赵新华从《意见》出台的背景与主要内容入手，结合全国电力体制改革路径与山东电力市场发展实际，系统讲解了针对不同场景精准施策、培育新能源新业态、推动电力系统升级、完善电力市场机制以及强化技术支撑等方面的重要举措，详细阐述了各条款出台的意义与必要性。<span data-pm-slice="0 0 []">与会人员就《意见》制定的背景与实施路径展开了热烈讨论。</span></p>
<p>&nbsp; &nbsp; 赵新华在分享时指出：习近平主席多次强调，应对气候变化不是别人要我们做，而是我们自己要做，是中国可持续发展的内在要求，也是推动构建人类命运共同体的责任担当。作为政府与企业沟通的桥梁，协会将进一步加强政策宣传与解读，密切联系会员企业，共同助力山东省绿色低碳高质量发展先行区建设，为彰显大国担当贡献&ldquo;协会力量&rdquo;。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ec986b57cb8c47acab2a52daf4a108184jerlo6dah.png" /></p>', '12月29日上午，山东省绿色低碳产业发展协会秘书处开展“每周一学”专项活动。本次学习由协会会长单位——山钢集团驻会专家赵新华主讲，围绕《 关于促进新能源消纳和调控的指导意见 》(发改能源〔2025〕1360号，以下简称《意见》)展开政策解读，协会秘书处成员参与学习。 赵新华从《意见》出台的背景与主要...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/77659f10b1594c0bbaccbbb01c2c32ffysfz496vzo.png', 'admin', 29, 0, 1, '2025-12-29 16:55:24', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00'),
  (1, '协会赴东营市开展绿色低碳专题调研', '<section>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/0c5bee5623a14e97a3fa632b9a0040dbu6il7hs6oz.png" /></p>
<p style="text-align: center;">座谈会现场</p>
</section>
<section>
<p>&nbsp; &nbsp; 2025年11月14日，山东省绿色低碳产业发展协会携专家团队赴东营市开展绿色低碳专题调研。本次调研以&ldquo;座谈会＋实地参观&rdquo;的形式展开，聚焦会员企业转型痛点，搭建政企银研对接桥梁，助力东营市绿色低碳高质量发展。</p>
<p>&nbsp; &nbsp; 座谈会在万达控股集团有限公司举行，由万达石化集团精益能源部经理崔斌主持。东营市发展和改革委员会、垦利区发展改革局相关领导、7家会员企业代表及恒丰银行、协会政研室专家代表等参会。</p>
</section>
<p>&nbsp; &nbsp; 东营市发展改革委相关领导对协会一行的到来表示热烈欢迎，并就东营市在推动绿色低碳转型方面的进展和成效展开介绍。东营市发改委领导同时对协会做出期望，希望协会通过本次调研，全面了解东营市绿色低碳产业发展的真实情况，了解东营市企业的&ldquo;痛点&rdquo;、&ldquo;难点&rdquo;和&ldquo;堵点&rdquo;问题，助力东营市打通转型发展的关键环节。</p>
<p>&nbsp; &nbsp; 山东省绿色低碳产业发展协会对东营市发改委、垦利区发改局和理事单位万达石化集团对本次调研的大力支持表示感谢，并指出本次调研的三个目的：倾听呼声，精准对接；总结经验，推广示范；传递政策，赋能发展。协会将继续做好政企之间的&ldquo;连心桥&rdquo;，打好服务企业的&ldquo;组合拳&rdquo;，及时传递政策信息，积极反映企业诉求，全力搭建合作平台，与大家携手推动全省绿色低碳产业迈上新台阶。</p>
<p>&nbsp; &nbsp; 会上，万达石化集团、利华益集团股份有限公司、东营联合石化有限责任公司、山东中金岭南铜业有限责任公司、贵研催化剂（东营）有限公司、山东华泰纸业股份有限公司、东营市海科瑞林化工有限公司等会员企业代表分别介绍各自在节能降碳领域的关键技术和工艺，以及数字化管理等绿色低碳领域的创新实践。</p>
<p>&nbsp; &nbsp; 协会政研室主任侯鹏飞向参会代表介绍了协会成立的背景及成立以来的工作情况，并就本次座谈会上企业提出的碳交易及项目申报等方面的需求做出初步回应，并表示协会会及时反映企业诉求，回应企业关切。恒丰银行专家介绍了其在绿色金融领域可以为会员企业提供的服务，并表示恒丰银行会竭力助力会员企业发展。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/172d896bcf2147788cdc25067b6a93bec5ls1dy3xj.png" /></p>
<p style="text-align: center;">王敏</p>
<p style="text-align: center;">万达石化集团</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/20bcc3112d53432ebed4f091dad02180mp2r68r2ox.png" /></p>
<p style="text-align: center;">贺宗昌</p>
<p style="text-align: center;">利华益集团股份有限公司</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/471b697ee9c54fcca368719284da7d07z86zo55tau.png" /></p>
<p style="text-align: center;">聂人杰</p>
<p style="text-align: center;">东营联合石化有限责任公司</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/cf971e19b59445bfad5124f81575013enue8fvan09.png" /></p>
<p style="text-align: center;">谭克勤</p>
<p style="text-align: center;">山东中金岭南铜业有限责任公司</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/de795294915640a2b58adb3f1d52f14egchfc3lf20.png" /></p>
<p style="text-align: center;">王国宇</p>
<p style="text-align: center;">贵研催化剂（东营）有限公司</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/a939eac5372b4a8099d092d22a58b272tkgg0dbemb.png" /></p>
<p style="text-align: center;">刘天喜</p>
<p style="text-align: center;">山东华泰纸业股份有限公司</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/1cc0117f74524388b7f4896b93b31519pxk8jzm4jv.png" /></p>
<p style="text-align: center;">权本龙</p>
<p style="text-align: center;">东营市海科瑞林化工有限公司</p>
<p>&nbsp; &nbsp; 会上，万达石化集团、利华益集团股份有限公司、东营联合石化有限责任公司、山东中金岭南铜业有限责任公司、贵研催化剂（东营）有限公司、山东华泰纸业股份有限公司、东营市海科瑞林化工有限公司等会员企业代表分别介绍各自在节能降碳领域的关键技术和工艺，以及数字化管理等绿色低碳领域的创新实践。</p>
<p>&nbsp; &nbsp; 协会政研室主任侯鹏飞向参会代表介绍了协会成立的背景及成立以来的工作情况，并就本次座谈会上企业提出的碳交易及项目申报等方面的需求做出初步回应，并表示协会会及时反映企业诉求，回应企业关切。恒丰银行专家介绍了其在绿色金融领域可以为会员企业提供的服务，并表示恒丰银行会竭力助力会员企业发展。</p>
<p>&nbsp; &nbsp;&nbsp;<img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/6ac65e6b855a438a801dd3c5d9113eb9c3qq6f82ef.png" /><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/5fc25b66af114d5ba9b974387ecca84d3xb6gan94z.png" /><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/be7eae4ea09849d0b3ba4c26c9dcf17e8605rmci3o.png" /></p>
<p>&nbsp; &nbsp; 会后，调研组一行与参会代表实地参观了万达集团数字展示中心，了解了万达集团37年的发展历史与绿色低碳优秀实践，为会员企业实现自身高质量发展积累了宝贵经验。</p>
<p>&nbsp; &nbsp; 此次调研加强了政府、协会与企业之间的沟通。下一步，协会将根据调研情况，整合专家、政策与金融资源，精准支持企业绿色转型，推动全省绿色低碳产业高质量发展。</p>
<p style="text-align: center;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/8de9e5c116154a708c07ba4f95e8efd250qj02z4jh.png" /></p>', '座谈会现场 2025年11月14日，山东省绿色低碳产业发展协会携专家团队赴东营市开展绿色低碳专题调研。本次调研以“座谈会＋实地参观”的形式展开，聚焦会员企业转型痛点，搭建政企银研对接桥梁，助力东营市绿色低碳高质量发展。 座谈会在万达控股集团有限公司举行，由万达石化集团精益能源部经理崔斌主持。东营市发...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/5fc25b66af114d5ba9b974387ecca84d3xb6gan94z.png', 'admin', 33, 0, 1, '2025-11-19 17:09:50', 1, 0, '2026-05-09 00:00:00', '2026-05-09 00:00:00');

-- 3. 政策法规 (category_id=3)
INSERT INTO portal_article
  (category_id, title, content, summary, cover_url, author, view_count, is_top, is_published, published_at, publisher_id, is_deleted, created_at, updated_at)
VALUES
  (3, '协会简介', '<p class="text-[15px] leading-[1.9] text-brand-muted md:text-[16px]">&nbsp; &nbsp; 山东省绿色低碳产业发展协会成立于2024年2月，是在山东省发展和改革委员会指导下成立的省级行业组织。省发改委对协会的功能定位是三个词：智囊团、助推器、服务站&mdash;&mdash;为政府决策提供行业洞察和政策建议，定期报送《绿色低碳产业信息直报》；为产业转型搭建供需对接平台，促成技术、资金、项目合作；为会员企业办实事解难题，建立&ldquo;3-7-15&rdquo;诉求响应机制。<br />&nbsp; &nbsp; 协会现有会员单位300余家，涵盖钢铁、化工、有色、建材、交通、矿山、金融等重点行业，基本覆盖山东十大产业。会长单位由山东钢铁集团有限公司担任，监事长单位为山东大学，副会长单位包括山东黄金集团、山东高速集团、山东环保集团、山东土地发展集团、恒丰银行、齐鲁工业大学（山东省科学院）等15家省属骨干企业和科研机构。</p>', '山东省绿色低碳产业发展协会成立于2024年2月，是在山东省发展和改革委员会指导下成立的省级行业组织。省发改委对协会的功能定位是三个词：智囊团、助推器、服务站——为政府决策提供行业洞察和政策建议，定期报送《绿色低碳产业信息直报》；为产业转型搭建供需对接平台，促成技术、资金、项目合作；为会员企业办实事解...', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/1deae590dbc5434b8e76f678aa8a41cdvju6zd7yni.png', '王蔚', 4, 0, 1, '2026-04-28 17:56:03', 1, 0, '2026-04-28 00:00:00', '2026-04-28 00:00:00');

-- 4. 活动 (portal_activity)
INSERT INTO portal_activity
  (title, content, cover_url, location, start_time, end_time, reg_deadline, max_capacity, reg_count, status, is_deleted, created_at, updated_at)
VALUES
  (' 绿色低碳，不是“包袱”是“红包”', '<p style="text-align: center;"><span style="font-family: 方正楷体_GB2312;">&mdash;&mdash;从两会看企业的&ldquo;新赛点&rdquo;</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 全国两会刚刚落幕，</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;绿色低碳&rdquo;又一次成了热词。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 有会员企业问：开了这么多天会，代表委员提了那么多建议，到底跟我们企业有多大关系？</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 这个问题问得好。我们必须搞清楚两会跟企业账本的关系。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 仔细梳理</span><span style="font-family: 方正仿宋_GB2312;">2025年两会的政策信号，我们发现：绿色低碳，正在从&ldquo;要你合规&rdquo;的紧箍咒，变成&ldquo;帮你赚钱&rdquo;的新赛道。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">一、风向彻底变了：绿色不是</span><span style="font-family: 黑体;">&ldquo;成本&rdquo;，是&ldquo;资产&rdquo;</span></p>
<p style="text-align: center;"><span style="font-family: 黑体;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/913a918a9e7e4181a5820000fd42ce46m2axkbz17x.png" /></span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 今年的政府工作报告提出：</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;协同推进降碳减污扩绿增长，加快经济社会发展全面绿色转型。&rdquo;</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 关键词不是</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;降碳&rdquo;，也不是&ldquo;减污&rdquo;，而是&ldquo;协同&rdquo;和&ldquo;增长&rdquo;。过去讲环保，往往是关停并转、成本增加；现在讲环保，是要跟&ldquo;增长&rdquo;绑在一起。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 过去几年，不少企业对绿色转型的心态是</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;被推着走&rdquo;：政策来了就应付一下，补贴有了就跟进一下。但今年两会传递出的信号是&mdash;&mdash;绿色本身就是价值，低碳本身就是效益。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 全国政协委员、吉利控股集团董事长李书福说得直白：</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;新能源汽车、锂电池、光伏产品代表中国绿色产业发展&lsquo;新三样&rsquo;，是我国经济增长新亮点。&rdquo;这不是在讲环保，这是在讲生意。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 对协会的会员企业而言，这意味着什么？意味着如果还在把绿色低碳当成</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;成本项&rdquo;来压缩，就可能错失一个产业的&ldquo;风口期&rdquo;。相反，谁能率先把&ldquo;绿色价值&rdquo;盘活，谁就能在新一轮竞争中卡住身位。</span></p>
<p><span style="font-family: 黑体;">二、游戏规则变了：能耗</span><span style="font-family: 黑体;">&ldquo;松绑&rdquo;，绿电&ldquo;升值&rdquo;</span></p>
<p><span style="font-family: 黑体;"><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/f5f55fba10194819814445468b03c763yjdnmgg87q.png" /></span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 从</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;能耗双控&rdquo;到&ldquo;<span class="wx_search_keyword_wrap">碳排放双控</span>&rdquo;，这几个字的变化，很多企业还没意识到分量有多重。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 过去考核</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;用了多少能&rdquo;，现在考核&ldquo;排了多少碳&rdquo;。这意味着什么？意味着可再生能源的&ldquo;含金量&rdquo;被彻底释放了。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 过去，企业上了绿电，减的是碳排放，但能耗指标没减，甚至可能因为项目扩产而被卡住。现在逻辑变了：绿电消费不再计入能耗总量考核。这是一步大棋</span><span style="font-family: 方正仿宋_GB2312;">&mdash;&mdash;真正让绿电从&ldquo;政治账&rdquo;变成&ldquo;经济账&rdquo;。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 生态环境部数据显示，截至</span><span style="font-family: 方正仿宋_GB2312;">2025年6月底，我国非化石能源装机占比已达60.9%。这是什么概念？相当于每10度电里，有6度是&ldquo;绿色&rdquo;的。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 过去企业上绿电，是为了应付考核；现在上绿电，是为了给自己松绑、给产能腾空间。这笔账，值得每个企业主拿计算器好好按一按。</span></p>
<p><span style="font-family: 黑体;">三、市场逻辑变了：排出去的碳，可能是漏掉的钱</span></p>
<p><span style="font-family: 黑体;"><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/1751c1aa3e394459a6a7cc1c5811d262t89eoe1jlw.png" /></span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 全国<span class="wx_search_keyword_wrap">碳市场扩围</span>，钢铁、水泥、铝冶炼都被拉了进来。这意味着什么？</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 意味着</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;碳&rdquo;正在变成硬通货。&nbsp;</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 过去只有发电企业在</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;玩碳&rdquo;，现在重头行业都进场了，市场规模翻了倍。全国人大代表、阳光电源董事长曹仁贤建议，与周边国家构建碳市场链接，推进碳市场国际化。这是一个更大的想象空间&mdash;&mdash;中国的碳市场，未来可能不只是国内交易，而是区域性的、甚至国际性的市场。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 对很多会员企业来说，过去总觉得碳交易是</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;别人的事&rdquo;。但从今年开始，你工厂烟囱里排出去的，可能不是废气，是没有装进兜里的现金。谁先学会算碳账，谁就能在下一轮竞争里多一张牌。</span></p>
<p><span style="font-family: 黑体;">四、赛道变细了：零碳园区、碳足迹</span><span style="font-family: 黑体;">&hellip;&hellip;每一个都是生意</span></p>
<p style="text-align: center;"><span style="font-family: 方正仿宋_GB2312;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/c38d3e559bf34f6bb2c746ceb827f8d1s95r7lbhl0.png" /></span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 今年的两会，还释放出一批具体的政策抓手：</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; &mdash;&mdash;加快建设&ldquo;沙戈荒&rdquo;新能源基地，发展海上风电；</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; &mdash;&mdash;扎实开展国家碳达峰第二批试点，建立一批零碳园区、零碳工厂；</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; &mdash;&mdash;开展<span class="wx_search_keyword_wrap">碳排放统计核算</span>，建立产品碳足迹管理体系、碳标识认证制度。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 这些关键词，每一个背后都是一条产业链、一个市场空间。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 比如零碳园区。全国人大代表、山西国际能源集团水务公司首席工程师李丽丽建议，尽快出台统一标准。这意味着什么？意味着标准一旦确立，游戏规则就定了</span><span style="font-family: 方正仿宋_GB2312;">&mdash;&mdash;以后不是你想不想建，是头部企业会逼着你建。大厂采购，先看你的&ldquo;碳账本&rdquo;。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 比如碳足迹。产品出口，人家不只看价格标签，开始看</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;<span class="wx_search_keyword_wrap">碳标签</span>&rdquo;。这不是绿色壁垒，是新的市场门票。谁先达标，谁就能拿到第一波红利。</span></p>
<p><span style="font-family: 黑体;">五、山东的底色，就是我们的底气</span></p>
<p style="text-align: center;"><span style="font-family: 黑体;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/258652f506504bb296e888689dfd1f8295fd7eklks.png" /></span></p>
<p><span style="font-family: 黑体;">&nbsp; 2024年，山东新增绿电423亿千瓦时&mdash;&mdash;这个数字的含金量在于，它超过了全省用电增量。&nbsp;</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 翻译成大白话：山东每多用一度电，就多了一度绿电。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 2025年3月，《山东省绿色低碳高质量发展促进条例》施行。这是全国首创，意味着山东要用法治给绿色转型&ldquo;撑腰&rdquo;。</span></p>
<p>&nbsp; &nbsp;对协会来说，当会员企业手握碳资产不知如何变现时，我们就去找资金、找买家，帮他们把&ldquo;绿色价值&rdquo;盘活；当会员企业面对<span class="wx_search_keyword_wrap">碳足迹核算</span>一头雾水时，我们就去请专家、定标准，帮他们把&ldquo;市场门槛&rdquo;迈过；当会员企业想参与绿电交易但不知从哪入手，我们就去当那个&ldquo;引路人&rdquo;，帮他们把&ldquo;新赛道&rdquo;跑出加速度。</p>
<p><span style="font-family: 黑体;">六、这场新赛点，你打算什么时候起跑？</span></p>
<p style="text-align: center;"><span style="font-family: 黑体;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/619282240e0b47089235ad8e7b1da5872vypm2telx.png" /></span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 两会闭幕，但绿色低碳的</span><span style="font-family: 方正仿宋_GB2312;">这场</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;新赛点&rdquo;</span><span style="font-family: 方正仿宋_GB2312;">，</span><span style="font-family: 方正仿宋_GB2312;">才刚刚鸣枪。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 这场比赛</span><span style="font-family: 方正仿宋_GB2312;">有个特点：</span><span style="font-family: 方正仿宋_GB2312;">没有旁观</span><span style="font-family: 方正仿宋_GB2312;">席</span><span style="font-family: 方正仿宋_GB2312;">，只有</span><span style="font-family: 方正仿宋_GB2312;">赛道。</span><span style="font-family: 方正仿宋_GB2312;">你不跑，对手在跑；你不动，机会在动。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 对协会而言，我们不想当那个</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;喊口号的人&rdquo;，只想当好&ldquo;陪跑的人&rdquo;&mdash;&mdash;</span><span style="font-family: 方正仿宋_GB2312;">用专业服务帮企业跑得更稳，用资源整合帮企业跑得更快，用价值创造帮企业跑得更远。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 绿色不是包袱是机遇；低碳不是紧箍咒，而是竞争力。</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 看懂的人已经在算账，犹豫的人还在问</span><span style="font-family: 方正仿宋_GB2312;">&ldquo;跟我有什么关系&rdquo;。&nbsp;</span></p>
<p><span style="font-family: 方正仿宋_GB2312;">&nbsp; &nbsp; 这场新赛点，你打算什么时候起跑？</span></p>
<p style="text-align: center;"><span style="font-family: 方正仿宋_GB2312;"><img class="wscnph" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ec986b57cb8c47acab2a52daf4a108184jerlo6dah.png" /></span></p>', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/619282240e0b47089235ad8e7b1da5872vypm2telx.png', '山东省', '2026-03-17 14:02:43', '2026-03-17 14:02:43', '2026-03-17 14:02:43', NULL, 0, 4, 0, '2026-05-11 00:00:00', '2026-05-11 00:00:00'),
  ('中央连发两份“双碳”文件，释放了什么信号？山东企业如何应对？', '<p>&nbsp; &nbsp; 4月23日，新华社受权发布了两份重磅文件：《关于更高水平更高质量做好节能降碳工作的意见》和《碳达峰碳中和综合评价考核办法》，均经中共中央、国务院同意，由中办、国办印发。</p>
<p>&nbsp; &nbsp; 两份文件连续发布，绝非偶然。这是&ldquo;十五五&rdquo;开局之年，国家在碳达峰碳中和领域最核心的制度性安排&mdash;&mdash;前一份是&ldquo;行动路线图&rdquo;，后一份是&ldquo;考核指挥棒&rdquo;。两者相互呼应，标志着国家从&ldquo;目标设定&rdquo;正式转向&ldquo;刚性考核+深度行动&rdquo;的新阶段。</p>
<p>&nbsp; &nbsp; 作为山东省绿色低碳产业发展协会，我们第一时间梳理核心要点，帮助会员企业理解政策、把握机遇、应对挑战。</p>
<p>&nbsp; &nbsp; 一、文件速览：两份文件讲了什么？</p>
<section><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/d4c09260681b437a9ee72a5644437cb8z4pwgsqd1k.png" /></section>
<p>&nbsp; &nbsp; 二、核心要点解读</p>
<p>&nbsp; &nbsp; （一）《关于更高水平更高质量做好节能降碳工作的意见》</p>
<p>&nbsp; &nbsp; 这份意见内容具体、具有实操性，堪称&ldquo;十五五&rdquo;节能降碳的行动手册。我们提炼出与会员企业最相关的六大核心政策点：</p>
<p>&nbsp; &nbsp; 核心点1：&ldquo;两高&rdquo;项目新增门槛大幅提高</p>
<p>&nbsp; &nbsp; 新（改、扩）建高耗能高排放工业项目，须制定碳排放等量或减量置换方案，落实情况作为碳排放评价重要内容。</p>
<p>&nbsp; &nbsp; 这意味着：未来新增&ldquo;两高&rdquo;项目，必须先找到&ldquo;减排指标&rdquo;来置换，否则无法获批。存量企业的减排成果将变得更有价值。</p>
<p>&nbsp; &nbsp; 核心点2：零碳园区、&ldquo;以绿制绿&rdquo;模式被重点鼓励</p>
<p>&nbsp; &nbsp; 推进零碳园区建设，发展以绿色能源制造绿色产品的&ldquo;以绿制绿&rdquo;模式。</p>
<p>&nbsp; &nbsp; 这意味着：园区和企业如果能用风电、光伏等绿电生产绿色产品，将成为国家鼓励的方向。山东有大量开发区和龙头企业，完全有条件率先打造标杆。</p>
<p>&nbsp; &nbsp; 核心点3：煤炭、石油消费要逐步达峰</p>
<p>&nbsp; &nbsp; 深入推进减煤控油，推动煤炭消费和石油消费逐步达峰。合理控制煤电装机规模和发电量。</p>
<p>&nbsp; &nbsp; 这意味着：化石能源消费的&ldquo;天花板&rdquo;即将到来，企业必须加快能源结构优化。</p>
<p>&nbsp; &nbsp; 核心点4：工业节能降碳聚焦重点行业和跨行业耦合</p>
<p>&nbsp; &nbsp; 全面提升钢铁、有色、石化、化工、建材等重点行业能效水平。支持钢化联产、炼化集成等跨行业耦合提效。</p>
<p>&nbsp; &nbsp; 这意味着：单一企业的节能改造空间有限，跨行业协同（如钢铁+化工联合生产）将成为新方向。</p>
<p>&nbsp; &nbsp; 核心点5：国家低碳转型基金要来了</p>
<p>&nbsp; &nbsp; 研究设立国家低碳转型基金，支持传统产业和资源富集地区绿色转型。</p>
<p>&nbsp; &nbsp; 这意味着：继国家绿色发展基金之后，又一国家级绿色基金即将落地。山东作为传统工业大省，有望获得重点支持。协会正在筹建的省级低碳转型基金可与之对接。</p>
<p>&nbsp; &nbsp; 核心点6：节能降碳服务市场化提速</p>
<p>&nbsp; &nbsp; 积极推行市场化节能降碳服务。鼓励节能降碳自愿承诺。</p>
<p>&nbsp; &nbsp; 这意味着：合同能源管理、第三方碳管理咨询、<span class="wx_search_keyword_wrap">碳核算</span>服务等将迎来发展机遇。</p>
<p>&nbsp; &nbsp; （二）《碳达峰碳中和综合评价考核办法》</p>
<p>&nbsp; &nbsp; 1. 考核谁？</p>
<p>&nbsp; &nbsp; 各省（自治区、直辖市）党委和政府。党政同责、&ldquo;一岗双责&rdquo;，地方党政主要负责同志是第一责任人。</p>
<p>&nbsp; &nbsp; 2. 考什么？</p>
<p>&nbsp; &nbsp; 设置控制指标和支撑指标两大类：</p>
<p><span data-pm-slice="1 1 [&quot;para&quot;,{&quot;tagName&quot;:&quot;p&quot;,&quot;attributes&quot;:{&quot;style&quot;:&quot;text-indent: 2em;margin-top: 8px;&quot;},&quot;namespaceURI&quot;:&quot;http://www.w3.org/1999/xhtml&quot;}]">&nbsp; &nbsp; ○</span>控制指标：碳排放总量、碳排放强度降低、煤炭消费总量、石油消费总量、非化石能源消费占比等（硬杠杠）</p>
<p>&nbsp; &nbsp; ○支撑指标：节能、工业、城乡建设、交通运输、公共机构、碳排放权交易等领域（过程管控）</p>
<p>&nbsp; &nbsp; 3. 怎么考？</p>
<p>&nbsp; &nbsp; 年度考核，分优秀、合格、不合格三个等次：</p>
<p><span data-pm-slice="1 1 [&quot;para&quot;,{&quot;tagName&quot;:&quot;p&quot;,&quot;attributes&quot;:{&quot;style&quot;:&quot;text-indent: 2em;margin-top: 8px;&quot;},&quot;namespaceURI&quot;:&quot;http://www.w3.org/1999/xhtml&quot;}]">&nbsp; &nbsp; ○</span>全部达标 &rarr; 优秀</p>
<p><span data-pm-slice="1 1 [&quot;para&quot;,{&quot;tagName&quot;:&quot;p&quot;,&quot;attributes&quot;:{&quot;style&quot;:&quot;text-indent: 2em;margin-top: 8px;&quot;},&quot;namespaceURI&quot;:&quot;http://www.w3.org/1999/xhtml&quot;}]">&nbsp; &nbsp; ○</span>1项控制指标不达标或3项支撑指标不达标 &rarr; 不合格</p>
<p><span data-pm-slice="1 1 [&quot;para&quot;,{&quot;tagName&quot;:&quot;p&quot;,&quot;attributes&quot;:{&quot;style&quot;:&quot;text-indent: 2em;margin-top: 8px;&quot;},&quot;namespaceURI&quot;:&quot;http://www.w3.org/1999/xhtml&quot;}]">&nbsp; &nbsp; ○</span>其余为合格</p>
<p>&nbsp; &nbsp; 4. 结果怎么用？</p>
<p><span data-pm-slice="1 1 [&quot;para&quot;,{&quot;tagName&quot;:&quot;p&quot;,&quot;attributes&quot;:{&quot;style&quot;:&quot;text-indent: 2em;margin-top: 8px;&quot;},&quot;namespaceURI&quot;:&quot;http://www.w3.org/1999/xhtml&quot;}]">&nbsp; &nbsp; ○</span>不合格：30个工作日内向党中央、国务院书面报告整改，逾期整改不到位将被约谈</p>
<p><span data-pm-slice="1 1 [&quot;para&quot;,{&quot;tagName&quot;:&quot;p&quot;,&quot;attributes&quot;:{&quot;style&quot;:&quot;text-indent: 2em;margin-top: 8px;&quot;},&quot;namespaceURI&quot;:&quot;http://www.w3.org/1999/xhtml&quot;}]">&nbsp; &nbsp; ○</span>优秀或单项突出：通报表扬，推广经验</p>
<p><span data-pm-slice="1 1 [&quot;para&quot;,{&quot;tagName&quot;:&quot;p&quot;,&quot;attributes&quot;:{&quot;style&quot;:&quot;text-indent: 2em;margin-top: 8px;&quot;},&quot;namespaceURI&quot;:&quot;http://www.w3.org/1999/xhtml&quot;}]">&nbsp; &nbsp; ○</span>考核结果作为省级领导班子和领导干部综合考核评价、选拔任用、监督管理的重要参考</p>
<p>&nbsp; &nbsp; 一句话总结：&ldquo;双碳&rdquo;工作做得好不好，直接关系到地方干部的&ldquo;位子&rdquo;。</p>
<p>&nbsp; &nbsp; 三、对山东意味着什么？</p>
<p>&nbsp; &nbsp; （一）考核压力空前，但也是转型机遇</p>
<p>&nbsp; &nbsp; 山东是全国碳排放大省，&ldquo;两高&rdquo;行业集中。在新的考核体系下，山东的控制指标（碳排放、煤炭消费、石油消费）压力巨大。但反过来，如果山东能够率先转型，取得&ldquo;优秀&rdquo;等次，就能成为国家典型，争取更多政策、资金、项目支持。</p>
<p>&nbsp; &nbsp; （二）山东的&ldquo;卖碳翁&rdquo;优势将更加凸显</p>
<p>&nbsp; &nbsp; 考核办法明确，评价考核可以采用全国碳市场数据。山东是全国碳配额净卖出量最大的省份（累计5171万吨，收益39亿元），履约率连续6个周期100%。这些成绩将在考核中得到体现，成为山东的&ldquo;加分项&rdquo;。</p>
<p>&nbsp; &nbsp; （三）零碳园区、低碳技术将迎来政策红利</p>
<p>&nbsp; &nbsp; 山东拥有大量开发区、工业园，以及山钢、信发、山东黄金、山东高速、山东港口等链主企业。这些企业完全有条件率先打造&ldquo;零碳工厂&rdquo;&ldquo;零碳园区&rdquo;&ldquo;<span class="wx_search_keyword_wrap">零碳运输走廊</span>&rdquo;，抢占政策先机。</p>
<p>&nbsp; &nbsp; 四、对会员企业有什么影响？该如何应对？</p>
<p>&nbsp; &nbsp; （一）两类企业需重点关注</p>
<section><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/0d03b96eca01472a9c5c2e6dfd2e6da8d5055vh6ae.png" /></section>
<p>&nbsp; &nbsp; （二）所有企业都应关注的&ldquo;通用要求&rdquo;</p>
<p><span data-pm-slice="1 1 [&quot;para&quot;,{&quot;tagName&quot;:&quot;p&quot;,&quot;attributes&quot;:{&quot;style&quot;:&quot;text-indent: 2em;margin-top: 8px;&quot;},&quot;namespaceURI&quot;:&quot;http://www.w3.org/1999/xhtml&quot;}]">&nbsp; &nbsp; ○</span>能源结构优化：尽量使用绿电，布局分布式光伏、<span class="wx_search_keyword_wrap">储能</span>等。</p>
<p><span data-pm-slice="1 1 [&quot;para&quot;,{&quot;tagName&quot;:&quot;p&quot;,&quot;attributes&quot;:{&quot;style&quot;:&quot;text-indent: 2em;margin-top: 8px;&quot;},&quot;namespaceURI&quot;:&quot;http://www.w3.org/1999/xhtml&quot;}]">&nbsp; &nbsp; ○</span>能效提升：关注国家更新的<span class="wx_search_keyword_wrap">能效限额标准</span>，提前对标整改。</p>
<p><span data-pm-slice="1 1 [&quot;para&quot;,{&quot;tagName&quot;:&quot;p&quot;,&quot;attributes&quot;:{&quot;style&quot;:&quot;text-indent: 2em;margin-top: 8px;&quot;},&quot;namespaceURI&quot;:&quot;http://www.w3.org/1999/xhtml&quot;}]">&nbsp; &nbsp; ○</span>碳排放管理能力建设：培养或引进专业碳管理人才，建立内部碳核算体系。</p>
<p><span data-pm-slice="1 1 [&quot;para&quot;,{&quot;tagName&quot;:&quot;p&quot;,&quot;attributes&quot;:{&quot;style&quot;:&quot;text-indent: 2em;margin-top: 8px;&quot;},&quot;namespaceURI&quot;:&quot;http://www.w3.org/1999/xhtml&quot;}]">&nbsp; &nbsp; ○</span>参与节能降碳服务市场：可委托第三方进行节能诊断、碳管理咨询，协会可提供推荐机构名单。</p>
<p>&nbsp; &nbsp; 五、协会将如何赋能企业？</p>
<p>&nbsp; &nbsp; 作为全省绿色低碳领域的行业协会，我们将从以下方面助力会员企业应对新政策：</p>
<p>&nbsp; &nbsp; 专题培训：近期组织一次政策解读培训会，邀请省发改委、生态环境厅专家详解两份文件。</p>
<p>&nbsp; &nbsp; &ldquo;一企一策&rdquo;帮扶：针对重点&ldquo;两高&rdquo;企业，协助进行<span class="wx_search_keyword_wrap">碳排放核查</span>、能效诊断、置换方案编制等。</p>
<p>&nbsp; &nbsp; 推动零碳标杆创建：遴选有意愿、有基础的会员企业或园区，联合专家团队打造&ldquo;零碳工厂&rdquo;&ldquo;零碳园区&rdquo;示范。</p>
<p>&nbsp; &nbsp; 对接国家低碳转型基金：筛选储备项目，为会员企业争取资金支持，争取首批落地山东。</p>
<p>&nbsp; &nbsp; 强化碳市场服务：结合考核办法对碳市场数据的重视，为会员企业提供碳核算、月度存证辅导等服务。</p>
<p>&nbsp; &nbsp; 两份文件的发布，释放出清晰信号：&ldquo;十五五&rdquo;的&ldquo;双碳&rdquo;工作，不再只是目标和口号，而是要与地方干部的&ldquo;帽子&rdquo;挂钩，与企业的项目审批挂钩，与全社会的节能降碳行动挂钩。</p>
<p>&nbsp; &nbsp; 对山东而言，这是压力，更是机遇&mdash;&mdash;从&ldquo;卖碳翁&rdquo;升级为&ldquo;低碳优等生&rdquo;，需要政府、协会、企业三方协同发力。</p>
<p>&nbsp; &nbsp; 协会将始终与会员企业站在一起，提供政策解读、技术对接、资源链接、能力建设等全方位服务。让我们共同迎接&ldquo;十五五&rdquo;绿色转型的新挑战，共创山东低碳发展的新篇章！</p>
<p><img class="wscnph" style="display: block; margin-left: auto; margin-right: auto;" src="http://10.30.10.49:9020/greenlink-public/legacy/portal/images/ec986b57cb8c47acab2a52daf4a108184jerlo6dah.png" /></p>', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/49d808bffb3a4f4e91416634ab8f409aqvnpaaa7t1.png', '山东省', '2026-04-29 11:34:07', '2026-04-29 11:34:07', '2026-04-29 11:34:07', NULL, 0, 4, 0, '2026-05-11 00:00:00', '2026-05-11 00:00:00');
