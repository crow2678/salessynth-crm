// tabs/DashboardTab.jsx
import React, { useState } from 'react';
import { 
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  ArrowRight,
  User,
  Building,
  DollarSign,
  Zap,
  AlertCircle,
  Timer,
  Users,
  FileText,
  MessageSquare,
  Star,
  Shield,
  Activity,
  Bell,
  ChevronRight,
  PlayCircle,
  Briefcase
} from 'lucide-react';
import { GoogleNewsCard } from '../common/CommonComponents';
import { formatMarkdown } from '../utils/intelligenceUtils';

// Utility function to convert text to title case
const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// Deal Status Header
const DealStatusHeader = ({ displayName, dealValue, dealStage, dealRisk, nextAction }) => {
  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-lg mr-4">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {toTitleCase(displayName)} - {dealValue || '$TBD'} Opportunity
            </h1>
            <p className="text-gray-600">Deal Command Center</p>
          </div>
        </div>
        
        <div className={`flex items-center px-4 py-2 rounded-lg border-2 ${getRiskColor(dealRisk)}`}>
          {getRiskIcon(dealRisk)}
          <span className="ml-2 font-semibold">
            {dealRisk ? `${dealRisk.toUpperCase()} RISK` : 'ANALYZING'}
          </span>
        </div>
      </div>
      
      {nextAction && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <Bell className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Next Critical Action:</p>
              <p className="text-blue-800 mt-1">{nextAction}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Action Card Component
const ActionCard = ({ title, value, subtitle, icon: IconComponent, color = 'blue', urgency = 'normal', onClick }) => {
  const getColorClasses = (color, urgency) => {
    if (urgency === 'urgent') {
      return 'border-red-300 bg-red-50 hover:bg-red-100';
    }
    if (urgency === 'warning') {
      return 'border-amber-300 bg-amber-50 hover:bg-amber-100';
    }
    
    const colors = {
      blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
      green: 'border-green-200 bg-green-50 hover:bg-green-100',
      amber: 'border-amber-200 bg-amber-50 hover:bg-amber-100',
      red: 'border-red-200 bg-red-50 hover:bg-red-100',
      purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100'
    };
    return colors[color] || colors.blue;
  };

  const getTextColor = (color, urgency) => {
    if (urgency === 'urgent') return 'text-red-700';
    if (urgency === 'warning') return 'text-amber-700';
    
    const colors = {
      blue: 'text-blue-700',
      green: 'text-green-700',
      amber: 'text-amber-700',
      red: 'text-red-700',
      purple: 'text-purple-700'
    };
    return colors[color] || colors.blue;
  };

  const getIconColor = (color, urgency) => {
    if (urgency === 'urgent') return 'text-red-600';
    if (urgency === 'warning') return 'text-amber-600';
    
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      amber: 'text-amber-600',
      red: 'text-red-600',
      purple: 'text-purple-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div 
      className={`border-2 rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${getColorClasses(color, urgency)}`}
      onClick={onClick}
    >
      {urgency === 'urgent' && (
        <div className="flex justify-center mb-2">
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
            URGENT
          </span>
        </div>
      )}
      
      <div className="flex justify-center mb-3">
        <div className={`p-3 bg-white rounded-full shadow-sm`}>
          <IconComponent className={`h-6 w-6 ${getIconColor(color, urgency)}`} />
        </div>
      </div>
      
      <div className={`text-2xl font-bold ${getTextColor(color, urgency)} mb-1`}>
        {value}
      </div>
      <div className="text-sm font-semibold text-gray-700 mb-1">
        {title}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-600">
          {subtitle}
        </div>
      )}
    </div>
  );
};

// Deal Playbook Component
const DealPlaybook = ({ researchData, apolloData, pdlData, handleTabClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Generate playbook items based on available data
  const generatePlaybookItems = () => {
    const items = [];
    
    // Check for recent activity
    if (apolloData?.deals?.[0]) {
      const deal = apolloData.deals[0];
      items.push({
        status: 'completed',
        text: `Deal created: ${toTitleCase(deal.title || 'Sales Opportunity')}`,
        action: null
      });
    }
    
    // Check for company signals
    if (apolloData?.insights?.buyingSignals?.length > 0) {
      items.push({
        status: 'opportunity',
        text: `Buying signal detected: ${apolloData.insights.buyingSignals[0]}`,
        action: 'Schedule discovery call to explore needs'
      });
    }
    
    // Check for contact information
    if (apolloData?.keyPeople?.length > 0) {
      items.push({
        status: 'pending',
        text: `Key contact identified: ${apolloData.keyPeople[0].name}`,
        action: 'Reach out to establish relationship'
      });
    }
    
    // AI insights
    if (researchData?.summary) {
      items.push({
        status: 'analysis',
        text: 'AI analysis completed with strategic recommendations',
        action: 'Review full analysis for talking points'
      });
    }
    
    // Default next steps if no specific data
    if (items.length === 0) {
      items.push(
        {
          status: 'pending',
          text: 'Initial contact needed',
          action: 'Research key stakeholders and schedule intro call'
        },
        {
          status: 'opportunity',
          text: 'Qualification required',
          action: 'Determine budget, authority, need, and timeline'
        }
      );
    }
    
    return items;
  };

  const playbookItems = generatePlaybookItems();
  const visibleItems = isExpanded ? playbookItems : playbookItems.slice(0, 3);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-amber-600" />;
      case 'opportunity': return <Zap className="h-4 w-4 text-blue-600" />;
      case 'analysis': return <Activity className="h-4 w-4 text-purple-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-xl text-gray-900 flex items-center">
          <PlayCircle className="h-6 w-6 text-green-600 mr-3" />
          Deal Playbook
        </h3>
        <button 
          onClick={() => handleTabClick('deal')}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium"
        >
          Full Strategy
          <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>
      
      <div className="space-y-3">
        {visibleItems.map((item, idx) => (
          <div key={idx} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            {getStatusIcon(item.status)}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{item.text}</p>
              {item.action && (
                <p className="text-sm text-blue-600 mt-1">→ {item.action}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {playbookItems.length > 3 && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center justify-center py-2 mt-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {isExpanded ? 'Show Less' : `Show ${playbookItems.length - 3} More Steps`}
        </button>
      )}
    </div>
  );
};

// Intelligence Alert Component
const IntelligenceAlert = ({ googleData, apolloData }) => {
  const alerts = [];
  
  // Check for recent news
  if (googleData && googleData.length > 0) {
    const recentNews = googleData[0];
    if (recentNews.publishedDate) {
      const newsDate = new Date(recentNews.publishedDate);
      const daysSince = Math.floor((new Date() - newsDate) / (1000 * 60 * 60 * 24));
      if (daysSince <= 7) {
        alerts.push({
          type: 'news',
          urgency: 'medium',
          title: 'Recent News Alert',
          message: `New article published ${daysSince} days ago: "${recentNews.title.substring(0, 80)}..."`,
          action: 'Review for conversation starters'
        });
      }
    }
  }
  
  // Check for funding/growth signals
  if (apolloData?.funding?.lastFunding) {
    alerts.push({
      type: 'funding',
      urgency: 'high',
      title: 'Funding Signal',
      message: `Company raised ${apolloData.funding.lastFunding.amount} in ${apolloData.funding.lastFunding.type} funding`,
      action: 'Timing is ideal for expansion discussions'
    });
  }
  
  // Check for hiring signals
  if (apolloData?.insights?.growthIndicators?.length > 0) {
    const growthSignal = apolloData.insights.growthIndicators[0];
    if (growthSignal.toLowerCase().includes('hiring') || growthSignal.toLowerCase().includes('team')) {
      alerts.push({
        type: 'growth',
        urgency: 'medium',
        title: 'Growth Signal',
        message: growthSignal,
        action: 'Position solution as growth enabler'
      });
    }
  }
  
  if (alerts.length === 0) return null;
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center">
        <Bell className="h-6 w-6 text-red-600 mr-3" />
        Intelligence Alerts
      </h3>
      
      <div className="space-y-3">
        {alerts.map((alert, idx) => (
          <div key={idx} className={`border-l-4 rounded-r-lg p-4 ${
            alert.urgency === 'high' ? 'border-red-500 bg-red-50' :
            alert.urgency === 'medium' ? 'border-amber-500 bg-amber-50' :
            'border-blue-500 bg-blue-50'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{alert.title}</h4>
                <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                <p className="text-sm font-medium text-blue-600">💡 {alert.action}</p>
              </div>
              {alert.urgency === 'high' && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  HOT
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Contact Strategy Component
const ContactStrategy = ({ apolloData, pdlData, handleTabClick }) => {
  const contacts = [];
  
  // Add PDL contact if available
  if (pdlData?.personData?.data) {
    const person = pdlData.personData.data;
    contacts.push({
      name: person.full_name || `${person.first_name || ''} ${person.last_name || ''}`,
      title: person.job_title || 'Unknown Title',
      relationship: 'Primary Contact',
      lastContact: null,
      nextAction: 'Initial outreach',
      priority: 'high',
      email: person.emails?.[0]?.address,
      linkedin: person.linkedin_url
    });
  }
  
  // Add Apollo contacts
  if (apolloData?.keyPeople?.length > 0) {
    apolloData.keyPeople.slice(0, 2).forEach(person => {
      contacts.push({
        name: person.name,
        title: person.title,
        relationship: person.seniority || 'Stakeholder',
        lastContact: null,
        nextAction: 'Research and connect',
        priority: 'medium',
        email: person.email,
        linkedin: person.linkedinUrl
      });
    });
  }
  
  if (contacts.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-700 mb-2">No Contacts Identified</h3>
        <p className="text-gray-500 text-sm">Contact research in progress</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-xl text-gray-900 flex items-center">
          <Users className="h-6 w-6 text-green-600 mr-3" />
          Contact Strategy
        </h3>
        <button 
          onClick={() => handleTabClick('profile')}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium"
        >
          All Contacts
          <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>
      
      <div className="space-y-4">
        {contacts.map((contact, idx) => {
          const initials = contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          
          return (
            <div key={idx} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`w-12 h-12 ${
                contact.priority === 'high' ? 'bg-red-500' : 
                contact.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
              } text-white rounded-full flex items-center justify-center font-semibold`}>
                {initials}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{toTitleCase(contact.name)}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    contact.priority === 'high' ? 'bg-red-100 text-red-800' :
                    contact.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {contact.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{toTitleCase(contact.title)}</p>
                <p className="text-sm font-medium text-blue-600">→ {contact.nextAction}</p>
              </div>
              
              <div className="flex flex-col space-y-2">
                {contact.email && (
                  <button className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </button>
                )}
                {contact.linkedin && (
                  <button className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors">
                    <User className="h-4 w-4 text-blue-600" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main Dashboard Component
const DashboardTab = ({ 
  researchData, 
  googleData, 
  apolloData, 
  pdlData, 
  displayName, 
  lastUpdated, 
  handleTabClick 
}) => {
  // Calculate deal metrics from available data
  const dealValue = apolloData?.deals?.[0]?.value ? 
    `$${apolloData.deals[0].value.toLocaleString()}` : 
    pdlData?.dealValue || null;
    
  const dealStage = apolloData?.deals?.[0]?.status || 
    pdlData?.currentStage || 
    'Discovery';
    
  const dealRisk = pdlData?.dealScore ? 
    (pdlData.dealScore >= 70 ? 'Low' : 
     pdlData.dealScore >= 40 ? 'Medium' : 'High') : 
    'Medium';
    
  const winProbability = pdlData?.dealScore || 
    (dealStage === 'negotiation' ? 75 :
     dealStage === 'proposal' ? 60 :
     dealStage === 'qualified' ? 40 : 25);
     
  // Calculate overdue items (mock data - in real app would come from CRM)
  const overdueCount = 2; // Follow-ups, proposals, etc.
  const thisWeekTasks = 3; // Scheduled activities
  
  // Generate next action based on available data
  const generateNextAction = () => {
    if (apolloData?.insights?.buyingSignals?.length > 0) {
      return "Follow up on buying signal detected in company research";
    }
    if (apolloData?.keyPeople?.length > 0) {
      return `Reach out to ${apolloData.keyPeople[0].name} to establish relationship`;
    }
    if (dealStage === 'negotiation') {
      return "Address outstanding objections and push for contract signature";
    }
    if (dealStage === 'proposal') {
      return "Follow up on proposal sent - schedule review meeting";
    }
    return "Schedule discovery call to understand business needs";
  };

  const nextAction = generateNextAction();
  
  // Calculate timeline (weeks to close)
  const weeksToClose = dealStage === 'negotiation' ? 2 :
    dealStage === 'proposal' ? 4 :
    dealStage === 'qualified' ? 8 : 12;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Deal Status Header */}
      <DealStatusHeader 
        displayName={displayName}
        dealValue={dealValue}
        dealStage={dealStage}
        dealRisk={dealRisk}
        nextAction={nextAction}
      />
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ActionCard
          title="THIS WEEK"
          value={thisWeekTasks}
          subtitle="Scheduled Activities"
          icon={Calendar}
          color="blue"
          onClick={() => handleTabClick('deal')}
        />
        <ActionCard
          title="OVERDUE"
          value={overdueCount}
          subtitle="Follow-ups & Tasks"
          icon={AlertTriangle}
          color="red"
          urgency={overdueCount > 0 ? 'urgent' : 'normal'}
          onClick={() => handleTabClick('deal')}
        />
        <ActionCard
          title="WIN PROB"
          value={`${winProbability}%`}
          subtitle={winProbability > 50 ? "↗️ Strong" : "→ Developing"}
          icon={Target}
          color={winProbability > 70 ? 'green' : winProbability > 40 ? 'blue' : 'amber'}
          onClick={() => handleTabClick('deal')}
        />
        <ActionCard
          title="TIMELINE"
          value={`${weeksToClose}wks`}
          subtitle={`Close Est: ${dealRisk} Risk`}
          icon={Timer}
          color={weeksToClose <= 4 ? 'green' : 'blue'}
          onClick={() => handleTabClick('deal')}
        />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Deal Playbook */}
        <DealPlaybook 
          researchData={researchData}
          apolloData={apolloData}
          pdlData={pdlData}
          handleTabClick={handleTabClick}
        />
        
        {/* Intelligence Alerts */}
        <IntelligenceAlert 
          googleData={googleData}
          apolloData={apolloData}
        />
      </div>
      
      {/* Contact Strategy */}
      <ContactStrategy 
        apolloData={apolloData}
        pdlData={pdlData}
        handleTabClick={handleTabClick}
      />
    </div>
  );
};

export default DashboardTab;